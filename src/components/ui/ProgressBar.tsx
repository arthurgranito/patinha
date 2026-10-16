import { View } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props = { step: number; total: number };

/** Barra de progresso de um fluxo em passos (ex.: cadastro do cão, F08). */
export function ProgressBar({ step, total }: Props) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${step} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: step }}
      style={{
        height: 6,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${(step / total) * 100}%`,
          height: '100%',
          backgroundColor: theme.colors.primary,
        }}
      />
    </View>
  );
}
