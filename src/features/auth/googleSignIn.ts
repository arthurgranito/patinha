import NetInfo from '@react-native-community/netinfo';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { getSupabase } from '@/lib/supabase';

import { MSG_LOGIN_CANCELADO, MSG_SEM_CONEXAO } from './mensagens';
import { completeSignInFromUrl, loginErrorMessage, type LoginResult } from './session';

// Fecha a aba do navegador quando o app reabre pelo redirect (web e alguns Androids).
WebBrowser.maybeCompleteAuthSession();

/**
 * patinha://auth no app e no development build; exp://<host>/--/auth no Expo Go.
 * As duas formas precisam estar nas Redirect URLs do Supabase (docs/auth.md).
 */
export function getRedirectUrl(): string {
  return makeRedirectUri({ scheme: 'patinha', path: 'auth' });
}

/** F01-2: Google pelo navegador do sistema + PKCE. */
export async function signInWithGoogle(): Promise<LoginResult> {
  const net = await NetInfo.fetch();
  if (net.isConnected === false) return { ok: false, message: MSG_SEM_CONEXAO };

  const redirectTo = getRedirectUrl();
  if (__DEV__) {
    // Confira se bate com uma Redirect URL cadastrada no Supabase (docs/auth.md).
    console.log(`[auth] URL de retorno (makeRedirectUri): ${redirectTo}`);
  }
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { ok: false, message: loginErrorMessage(error) };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, message: MSG_LOGIN_CANCELADO };

  // TODO(fase 13): evento signup {provider: 'google'} no primeiro acesso.
  return completeSignInFromUrl(result.url);
}
