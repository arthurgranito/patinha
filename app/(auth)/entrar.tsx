import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/AuthProvider';
import { Boasvindas } from '@/features/auth/Boasvindas';
import { signInWithGoogle } from '@/features/auth/googleSignIn';
import type { LoginResult } from '@/features/auth/session';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

// Em builds e updates de produção o Metro troca __DEV__ por false e corta este require:
// o botão de teste e a senha do usuário local não entram no bundle (scripts/check-bundle.sh).
const DevLoginButton: typeof import('@/features/auth/DevLoginButton').DevLoginButton | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- require condicional, cortado em produção
  __DEV__ ? require('@/features/auth/DevLoginButton').DevLoginButton : null;

// F01 / F03 — entrada. Ao entrar, a guarda do app/_layout.tsx leva para o grupo (app).
// TODO(fase 14): "Entrar com Apple" nativo no iOS (ADR-03).
export default function EntrarScreen() {
  const theme = useTheme();
  const { notice, clearNotice } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'google' | 'dev' | null>(null);

  async function run(kind: 'google' | 'dev', action: () => Promise<LoginResult>) {
    setBusy(kind);
    setError(null);
    clearNotice();
    try {
      const result = await action();
      if (!result.ok) setError(result.message);
    } finally {
      setBusy(null);
    }
  }

  const message = error ?? notice;

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Boasvindas />
      </View>
      <View style={{ gap: theme.spacing.md }}>
        {message ? (
          <Text
            accessibilityRole="alert"
            style={{ color: theme.colors.danger, textAlign: 'center' }}
          >
            {message}
          </Text>
        ) : null}
        {!isSupabaseConfigured ? (
          <Text variant="caption" muted style={{ textAlign: 'center' }}>
            Supabase não configurado: veja o .env.example.
          </Text>
        ) : null}
        <Button
          label="Entrar com Google"
          loading={busy === 'google'}
          disabled={!isSupabaseConfigured || busy !== null}
          onPress={() => run('google', signInWithGoogle)}
        />
        {DevLoginButton ? (
          <DevLoginButton
            busy={busy === 'dev'}
            disabled={!isSupabaseConfigured || busy !== null}
            run={(action) => run('dev', action)}
          />
        ) : null}
      </View>
    </Screen>
  );
}
