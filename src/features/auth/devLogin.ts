import { getSupabase } from '@/lib/supabase';

import { loginErrorMessage, type LoginResult } from './session';

// Login de teste para o Maestro (.maestro/login.yaml). Só existe em desenvolvimento
// (__DEV__) E com EXPO_PUBLIC_DEV_LOGIN=true no .env. Builds e EAS Updates de preview e
// produção são empacotados com __DEV__ = false, então o botão nunca aparece neles.
// O usuário só existe no Supabase local (supabase/dev/usuario-teste.sql).
export const DEV_LOGIN_EMAIL = 'teste@patinha.local';
const DEV_LOGIN_PASSWORD = 'patinha-teste';

export function isDevLoginEnabled(
  isDev: boolean = __DEV__,
  flag: string | undefined = process.env.EXPO_PUBLIC_DEV_LOGIN,
): boolean {
  return isDev === true && flag === 'true';
}

export async function signInAsDevUser(): Promise<LoginResult> {
  if (!isDevLoginEnabled()) return { ok: false, message: 'Login de teste desligado.' };
  const { error } = await getSupabase().auth.signInWithPassword({
    email: DEV_LOGIN_EMAIL,
    password: DEV_LOGIN_PASSWORD,
  });
  return error ? { ok: false, message: loginErrorMessage(error) } : { ok: true };
}
