import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/lib/theme';

import { Text } from './Text';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: Props) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: isPrimary ? theme.colors.primary : 'transparent',
          borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
          opacity: isDisabled ? 0.5 : state.pressed ? 0.8 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.onPrimary : theme.colors.text} />
      ) : (
        <Text
          variant="body"
          style={[styles.label, { color: isPrimary ? theme.colors.onPrimary : theme.colors.text }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, minHeight: 52 },
  label: { fontWeight: '600' },
});
