import { Text as RNText, type TextProps } from 'react-native';

import { useTheme, type typography } from '@/lib/theme';

type Props = TextProps & { variant?: keyof typeof typography; muted?: boolean };

export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: muted ? theme.colors.textMuted : theme.colors.text },
        style,
      ]}
      {...rest}
    />
  );
}
