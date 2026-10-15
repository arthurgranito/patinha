import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { MSG_LOGIN_CANCELADO, MSG_LOGIN_FALHOU, MSG_SEM_CONEXAO } from '../mensagens';
import {
  __resetExchangesForTests,
  completeSignInFromUrl,
  loginErrorMessage,
  parseAuthCallback,
} from '../session';

const mockExchange = jest.fn();
jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ auth: { exchangeCodeForSession: mockExchange } }),
}));

beforeEach(() => {
  mockExchange.mockReset();
  __resetExchangesForTests();
});

describe('parseAuthCallback', () => {
  it('lê o code da query', () => {
    expect(parseAuthCallback('patinha://auth?code=abc')).toEqual({ code: 'abc', error: undefined });
  });
  it('lê o code no formato do Expo Go', () => {
    expect(parseAuthCallback('exp://192.168.0.10:8081/--/auth?code=xyz').code).toBe('xyz');
  });
  it('lê o erro do fragmento', () => {
    expect(parseAuthCallback('patinha://auth#error=access_denied').error).toBe('access_denied');
  });
});

describe('loginErrorMessage (F01-2e)', () => {
  it('erro de rede vira "Sem conexão"', () => {
    expect(loginErrorMessage(new AuthRetryableFetchError('Failed to fetch', 0))).toBe(
      MSG_SEM_CONEXAO,
    );
    expect(loginErrorMessage(new TypeError('Network request failed'))).toBe(MSG_SEM_CONEXAO);
  });
  it('outros erros viram a falha genérica', () => {
    expect(loginErrorMessage(new AuthApiError('invalid grant', 400, 'bad_code_verifier'))).toBe(
      MSG_LOGIN_FALHOU,
    );
  });
});

describe('completeSignInFromUrl', () => {
  it('troca o código pela sessão', async () => {
    mockExchange.mockResolvedValue({ error: null });
    await expect(completeSignInFromUrl('patinha://auth?code=c1')).resolves.toEqual({ ok: true });
    expect(mockExchange).toHaveBeenCalledWith('c1');
  });

  it('a mesma URL pelos dois caminhos troca o código uma vez e nenhum dá erro', async () => {
    // Na 2ª troca real o Supabase recusaria (verificador PKCE já consumido).
    mockExchange.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({
      error: new AuthApiError('code already used', 400, 'bad_code_verifier'),
    });
    const viaBrowser = completeSignInFromUrl('patinha://auth?code=c2');
    const viaDeepLink = completeSignInFromUrl('patinha://auth?code=c2');
    await expect(Promise.all([viaBrowser, viaDeepLink])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
    // E se o deep link chega depois de a troca terminar:
    await expect(completeSignInFromUrl('patinha://auth?code=c2')).resolves.toEqual({ ok: true });
    expect(mockExchange).toHaveBeenCalledTimes(1);
  });

  it('falha na troca mostra a mensagem do F01', async () => {
    mockExchange.mockResolvedValue({ error: new AuthApiError('bad', 400, 'bad_code_verifier') });
    await expect(completeSignInFromUrl('patinha://auth?code=c3')).resolves.toEqual({
      ok: false,
      message: MSG_LOGIN_FALHOU,
    });
  });

  it('sem internet na troca mostra "Sem conexão"', async () => {
    mockExchange.mockRejectedValue(new AuthRetryableFetchError('Failed to fetch', 0));
    await expect(completeSignInFromUrl('patinha://auth?code=c4')).resolves.toEqual({
      ok: false,
      message: MSG_SEM_CONEXAO,
    });
  });

  it('acesso negado no Google conta como cancelado', async () => {
    await expect(completeSignInFromUrl('patinha://auth?error=access_denied')).resolves.toEqual({
      ok: false,
      message: MSG_LOGIN_CANCELADO,
    });
    expect(mockExchange).not.toHaveBeenCalled();
  });
});
