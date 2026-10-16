import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

import { dogLimitMessage, type DogLimit } from './api';
import { MSG_MAIS_CAES_PREMIUM } from './mensagens';

/** F08-9e / F10: limite de cães do plano. */
export function LimiteCaes({ limit }: { limit: DogLimit }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
      }}
    >
      {limit === 'gratis' ? <Text variant="subtitle">{MSG_MAIS_CAES_PREMIUM}</Text> : null}
      <Text>{dogLimitMessage(limit)}</Text>
      {/* TODO(fase 12): link para o paywall (F33) com o contexto "Mais cães no Premium". */}
    </View>
  );
}
