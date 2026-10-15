import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

import { Text } from './Text';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** Seletor numérico com − e +, acessível (accessibilityRole adjustable). */
export function Stepper({ label, value, min, max, format = String, onChange }: Props) {
  const theme = useTheme();
  const shown = format(value);
  const button = (sign: -1 | 1) => {
    const next = value + sign;
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${sign < 0 ? 'Diminuir' : 'Aumentar'} ${label.toLowerCase()}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={[
          styles.btn,
          {
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text variant="subtitle">{sign < 0 ? '−' : '+'}</Text>
      </Pressable>
    );
  };
  return (
    <View
      accessible={false}
      style={[styles.row, { gap: theme.spacing.md }]}
      accessibilityLabel={`${label}: ${shown}`}
    >
      <Text style={styles.label}>{label}</Text>
      {button(-1)}
      <Text variant="subtitle" style={styles.value}>
        {shown}
      </Text>
      {button(1)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1 },
  btn: { width: 40, height: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 56, textAlign: 'center' },
});
