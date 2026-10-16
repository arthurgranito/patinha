import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

type Props = { name: string; uri?: string | null; size?: number };

/** Foto do cão ou, sem foto (F08-2a), um avatar com a inicial. */
export function DogAvatar({ name, uri, size = 56 }: Props) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image accessibilityLabel={`Foto de ${name}`} source={{ uri }} style={shape} />;
  }
  const initial = [...name.trim()][0]?.toUpperCase() ?? '🐾';
  return (
    <View
      accessibilityLabel={`Avatar de ${name}`}
      style={[
        shape,
        {
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.onPrimary,
          fontSize: size * 0.45,
          lineHeight: size * 0.55,
          fontWeight: '700',
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
