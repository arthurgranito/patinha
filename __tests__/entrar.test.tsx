import { render, screen } from '@testing-library/react-native';

import EntrarScreen from '../app/(auth)/entrar';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, getSupabase: jest.fn() }));
jest.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ notice: 'Sua sessão expirou. Entre de novo.', clearNotice: jest.fn() }),
}));
jest.mock('@/features/auth/googleSignIn', () => ({ signInWithGoogle: jest.fn() }));

const g = globalThis as unknown as { __DEV__: boolean };

describe('EntrarScreen (F01)', () => {
  const originalDev = g.__DEV__;
  const originalFlag = process.env.EXPO_PUBLIC_DEV_LOGIN;
  afterEach(() => {
    g.__DEV__ = originalDev;
    process.env.EXPO_PUBLIC_DEV_LOGIN = originalFlag;
  });

  it('mostra as boas-vindas, o botão do Google e o aviso de sessão expirada (X.2)', async () => {
    await render(<EntrarScreen />);
    expect(screen.getByText('10 minutinhos por dia')).toBeTruthy();
    expect(screen.getByText('Entrar com Google')).toBeTruthy();
    expect(screen.getByText('Sua sessão expirou. Entre de novo.')).toBeTruthy();
  });

  it('não mostra "Entrar como teste" fora do __DEV__, mesmo com a variável ligada', async () => {
    g.__DEV__ = false;
    process.env.EXPO_PUBLIC_DEV_LOGIN = 'true';
    await render(<EntrarScreen />);
    expect(screen.queryByText('Entrar como teste')).toBeNull();
  });

  it('não mostra "Entrar como teste" sem a variável', async () => {
    delete process.env.EXPO_PUBLIC_DEV_LOGIN;
    await render(<EntrarScreen />);
    expect(screen.queryByText('Entrar como teste')).toBeNull();
  });

  it('mostra "Entrar como teste" em __DEV__ com EXPO_PUBLIC_DEV_LOGIN=true', async () => {
    g.__DEV__ = true;
    process.env.EXPO_PUBLIC_DEV_LOGIN = 'true';
    await render(<EntrarScreen />);
    expect(screen.getByText('Entrar como teste')).toBeTruthy();
  });
});
