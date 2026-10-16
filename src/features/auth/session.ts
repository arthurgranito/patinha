import { AuthRetryableFetchError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { MSG_LOGIN_CANCELADO, MSG_LOGIN_FALHOU, MSG_SEM_CONEXAO } from './mensagens';

export type LoginResult = { ok: true } | { ok: false; message: string };

/** Erro de rede (sem internet, timeout) vira "Sem conexão"; o resto, falha genérica. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof AuthRetryableFetchError) return MSG_SEM_CONEXAO;
  if (error instanceof TypeError && /network/i.test(error.message)) return MSG_SEM_CONEXAO;
  return MSG_LOGIN_FALHOU;
}

/** Lê `code` (ou `error`) da URL de volta do OAuth: query ou fragmento. */
export function parseAuthCallback(url: string): { code?: string; error?: string } {
  const start = url.search(/[?#]/);
  const params = new URLSearchParams(start === -1 ? '' : url.slice(start + 1).replace('#', '&'));
  return {
    code: params.get('code') ?? undefined,
    error: params.get('error') ?? undefined,
  };
}

// Troca de código em um lugar só (F01-2). A URL de volta pode chegar por dois caminhos:
// o resultado do openAuthSessionAsync e o deep link aberto em app/auth.tsx (Android).
// Os dois caem aqui; o mesmo código é trocado uma vez e a 2ª chamada recebe o mesmo resultado.
const exchanges = new Map<string, Promise<LoginResult>>();

export function exchangeCode(code: string): Promise<LoginResult> {
  const existing = exchanges.get(code);
  if (existing) return existing;

  const attempt = (async (): Promise<LoginResult> => {
    try {
      const { error } = await getSupabase().auth.exchangeCodeForSession(code);
      if (!error) return { ok: true };
      return { ok: false, message: loginErrorMessage(error) };
    } catch (error) {
      return { ok: false, message: loginErrorMessage(error) };
    }
  })();
  exchanges.set(code, attempt);
  return attempt;
}

export function completeSignInFromUrl(url: string): Promise<LoginResult> {
  const { code, error } = parseAuthCallback(url);
  if (code) return exchangeCode(code);
  if (error === 'access_denied')
    return Promise.resolve({ ok: false, message: MSG_LOGIN_CANCELADO });
  return Promise.resolve({ ok: false, message: MSG_LOGIN_FALHOU });
}

/** Só para testes. */
export function __resetExchangesForTests() {
  exchanges.clear();
}

/** F04 / X.2 / X.3: sai só deste aparelho (não usa a rede). */
export async function signOutLocal(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().auth.signOut({ scope: 'local' });
}

const VALIDACAO_TIMEOUT_MS = 8000;

/**
 * X.2: confere no servidor a sessão restaurada do aparelho. `true` só quando o servidor a
 * recusa (usuário apagado, token inválido). Sem rede ou demorando, a sessão fica (uso offline).
 */
export async function isStoredSessionRejected(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), VALIDACAO_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([getSupabase().auth.getUser(), timeout]);
    if (result === 'timeout') return false;
    const { error } = result;
    return Boolean(error) && !isAuthRetryableFetchError(error);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
