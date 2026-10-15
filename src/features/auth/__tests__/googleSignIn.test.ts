import NetInfo from '@react-native-community/netinfo';
import * as WebBrowser from 'expo-web-browser';

import { signInWithGoogle } from '../googleSignIn';
import { MSG_LOGIN_CANCELADO, MSG_LOGIN_FALHOU, MSG_SEM_CONEXAO } from '../mensagens';
import { __resetExchangesForTests, completeSignInFromUrl } from '../session';

const mockSignInWithOAuth = jest.fn();
const mockExchange = jest.fn();
jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: { signInWithOAuth: mockSignInWithOAuth, exchangeCodeForSession: mockExchange },
  }),
}));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'patinha://auth' }));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

const openAuthSessionAsync = WebBrowser.openAuthSessionAsync as jest.Mock;
const netFetch = NetInfo.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  __resetExchangesForTests();
  netFetch.mockResolvedValue({ isConnected: true });
  mockSignInWithOAuth.mockResolvedValue({
    data: { url: 'https://supabase/authorize' },
    error: null,
  });
  mockExchange.mockResolvedValue({ error: null });
});

describe('signInWithGoogle (F01)', () => {
  it('abre o navegador com PKCE e troca o código ao voltar', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'patinha://auth?code=abc' });
    await expect(signInWithGoogle()).resolves.toEqual({ ok: true });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'patinha://auth', skipBrowserRedirect: true },
    });
    expect(openAuthSessionAsync).toHaveBeenCalledWith(
      'https://supabase/authorize',
      'patinha://auth',
    );
    expect(mockExchange).toHaveBeenCalledWith('abc');
  });

  it('2e: cancelou o navegador', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'cancel' });
    await expect(signInWithGoogle()).resolves.toEqual({ ok: false, message: MSG_LOGIN_CANCELADO });
    expect(mockExchange).not.toHaveBeenCalled();
  });

  it('2e: falha na troca do código', async () => {
    openAuthSessionAsync.mockResolvedValue({ type: 'success', url: 'patinha://auth?code=abc' });
    mockExchange.mockResolvedValue({ error: new Error('bad') });
    await expect(signInWithGoogle()).resolves.toEqual({ ok: false, message: MSG_LOGIN_FALHOU });
  });

  it('2e: sem internet nem abre o navegador', async () => {
    netFetch.mockResolvedValue({ isConnected: false });
    await expect(signInWithGoogle()).resolves.toEqual({ ok: false, message: MSG_SEM_CONEXAO });
    expect(openAuthSessionAsync).not.toHaveBeenCalled();
  });

  it('deep link (app/auth.tsx) e retorno do navegador juntos não geram erro', async () => {
    openAuthSessionAsync.mockImplementation(async () => {
      // O Android entrega o deep link enquanto o openAuthSessionAsync ainda resolve.
      void completeSignInFromUrl('patinha://auth?code=dup');
      return { type: 'success', url: 'patinha://auth?code=dup' };
    });
    mockExchange
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('code already used') });
    await expect(signInWithGoogle()).resolves.toEqual({ ok: true });
    expect(mockExchange).toHaveBeenCalledTimes(1);
  });
});
