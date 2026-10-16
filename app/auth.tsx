import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { completeSignInFromUrl } from '@/features/auth/session';

// Ponto de chegada do deep link patinha://auth?code=... (no Android ele também abre o app,
// além de voltar no resultado do openAuthSessionAsync). A troca do código é a mesma função
// usada pelo login; se o código já foi trocado, ela devolve o resultado já obtido.
export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { session } = useAuth();
  const [done, setDone] = useState(!code);

  useEffect(() => {
    if (!code) return;
    let active = true;
    completeSignInFromUrl(`patinha://auth?code=${encodeURIComponent(code)}`).finally(
      () => active && setDone(true),
    );
    return () => {
      active = false;
    };
  }, [code]);

  if (done) return <Redirect href={session ? '/' : '/entrar'} />;
  return (
    <Screen centered>
      <ActivityIndicator />
    </Screen>
  );
}
