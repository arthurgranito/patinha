import { render, screen, waitFor } from '@testing-library/react-native';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from '../AuthProvider';
import { MSG_SESSAO_EXPIRADA } from '../mensagens';

const listeners: ((event: string, session: unknown) => void)[] = [];
const mockAuth = {
  getSession: jest.fn(),
  getUser: jest.fn(),
  signOut: jest.fn(async () => {
    listeners.forEach((l) => l('SIGNED_OUT', null));
    return { error: null };
  }),
  onAuthStateChange: jest.fn((cb: (event: string, session: unknown) => void) => {
    listeners.push(cb);
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  }),
};
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({ auth: mockAuth }),
}));

const salva = { access_token: 'jwt-de-usuario-apagado', user: { id: 'u1' } };

function Estado() {
  const { session, loading, notice } = useAuth();
  if (loading) return <Text>carregando</Text>;
  return <Text>{`${session ? 'logado' : 'entrada'}|${notice ?? ''}`}</Text>;
}

beforeEach(() => {
  jest.clearAllMocks();
  listeners.length = 0;
  mockAuth.getSession.mockResolvedValue({ data: { session: salva } });
});

describe('AuthProvider: sessão salva ao iniciar (X.2)', () => {
  it('usuário apagado: sai só deste aparelho e volta para a entrada com o aviso', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError('User from sub claim in JWT does not exist', 403, 'user_not_found'),
    });
    await render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText(`entrada|${MSG_SESSAO_EXPIRADA}`)).toBeTruthy());
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('usuário válido: continua logado', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: salva.user }, error: null });
    await render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('logado|')).toBeTruthy());
    expect(mockAuth.signOut).not.toHaveBeenCalled();
  });

  it('sem internet: mantém a sessão (uso offline)', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });
    await render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('logado|')).toBeTruthy());
    expect(mockAuth.signOut).not.toHaveBeenCalled();
  });

  it('sem sessão salva: nem consulta o servidor', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    await render(
      <AuthProvider>
        <Estado />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('entrada|')).toBeTruthy());
    expect(mockAuth.getUser).not.toHaveBeenCalled();
  });
});
