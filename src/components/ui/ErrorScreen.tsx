import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';
import { useTheme } from '@/lib/theme';

import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

/** X.3 — erro inesperado. TODO(fase 13): enviar ao Sentry com versão, canal do EAS Update e usuário. */
export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();
  return (
    <Screen centered>
      <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
        <Text accessibilityRole="alert" style={{ textAlign: 'center' }}>
          {MSG_ERRO_INESPERADO}
        </Text>
        <Button label="Tentar de novo" onPress={onRetry} />
      </View>
    </Screen>
  );
}

/** ErrorBoundary da raiz (app/_layout.tsx): qualquer erro de renderização nas rotas cai aqui. */
export function RootErrorBoundary({ retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <SafeAreaProvider>
      <ErrorScreen onRetry={retry} />
    </SafeAreaProvider>
  );
}
