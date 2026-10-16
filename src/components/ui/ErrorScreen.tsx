import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { signOutLocal } from '@/features/auth/session';
import { describeError, showErrorDetails } from '@/lib/errorDetails';
import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

type Props = {
  onRetry: () => void;
  /** "Sair" (só deste aparelho): saída garantida para nunca prender o usuário nesta tela. */
  onSignOut?: () => void | Promise<void>;
  error?: unknown;
};

/** X.3 — erro inesperado. TODO(fase 13): enviar ao Sentry com versão, canal do EAS Update e usuário. */
export function ErrorScreen({ onRetry, onSignOut, error }: Props) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const details = error !== undefined && error !== null ? describeError(error) : null;

  async function handleSignOut() {
    if (!onSignOut) return;
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen centered>
      <View style={{ gap: theme.spacing.md, alignItems: 'stretch', width: '100%' }}>
        <Text accessibilityRole="alert" style={{ textAlign: 'center' }}>
          {MSG_ERRO_INESPERADO}
        </Text>
        <Button label="Tentar de novo" onPress={onRetry} />
        {onSignOut ? (
          <Button label="Sair" variant="secondary" loading={signingOut} onPress={handleSignOut} />
        ) : null}
        {details && showErrorDetails() ? (
          <>
            <Button
              label={showDetails ? 'Ocultar detalhes' : 'Detalhes'}
              variant="secondary"
              onPress={() => setShowDetails((v) => !v)}
            />
            {showDetails ? (
              <Text variant="caption" muted selectable>
                {`Código: ${details.code}\nMensagem: ${details.message}`}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

/** ErrorBoundary da raiz (app/_layout.tsx): qualquer erro de renderização nas rotas cai aqui. */
export function RootErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <SafeAreaProvider>
      <ErrorScreen
        error={error}
        onRetry={retry}
        // Fora do AuthProvider (que pode ter sido o que quebrou): sai direto e remonta as rotas,
        // que caem na tela de entrada sem sessão.
        onSignOut={
          isSupabaseConfigured
            ? async () => {
                await signOutLocal();
                await retry();
              }
            : undefined
        }
      />
    </SafeAreaProvider>
  );
}
