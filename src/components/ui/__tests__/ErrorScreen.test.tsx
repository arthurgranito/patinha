import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';

import { ErrorScreen, RootErrorBoundary as ErrorBoundary } from '../ErrorScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View };
});
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({ auth: { signOut: mockSignOut } }),
}));

const g = globalThis as unknown as { __DEV__: boolean };
const erro = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' };

describe('ErrorScreen (X.3)', () => {
  const originalDev = g.__DEV__;
  const originalFlag = process.env.EXPO_PUBLIC_ERROR_DETAILS;
  afterEach(() => {
    g.__DEV__ = originalDev;
    process.env.EXPO_PUBLIC_ERROR_DETAILS = originalFlag;
    mockSignOut.mockClear();
  });

  it('ErrorBoundary da raiz: mensagem do X.3 e "Tentar de novo" chama o retry', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText(MSG_ERRO_INESPERADO)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalled();
  });

  it('ErrorBoundary da raiz: "Sair" sai só deste aparelho e remonta as rotas', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(retry).toHaveBeenCalled());
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('"Sair" chama o onSignOut recebido', async () => {
    const onSignOut = jest.fn();
    await render(<ErrorScreen onRetry={jest.fn()} onSignOut={onSignOut} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(onSignOut).toHaveBeenCalled();
  });

  it('"Detalhes" mostra código e mensagem técnica no preview', async () => {
    g.__DEV__ = false;
    process.env.EXPO_PUBLIC_ERROR_DETAILS = 'true';
    await render(<ErrorScreen onRetry={jest.fn()} error={erro} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Detalhes' }));
    expect(screen.getByText(/Código: PGRST116/)).toBeTruthy();
    expect(screen.getByText(/multiple \(or no\) rows returned/)).toBeTruthy();
  });

  it('"Detalhes" não aparece em produção', async () => {
    g.__DEV__ = false;
    delete process.env.EXPO_PUBLIC_ERROR_DETAILS;
    await render(<ErrorScreen onRetry={jest.fn()} error={erro} />);
    expect(screen.queryByRole('button', { name: 'Detalhes' })).toBeNull();
    expect(screen.queryByText(/PGRST116/)).toBeNull();
  });
});
