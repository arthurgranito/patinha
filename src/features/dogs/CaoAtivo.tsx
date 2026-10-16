import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

import { DogAvatar } from './DogAvatar';

type Props = { name: string; photoUrl?: string; onPress: () => void };

/** Topo da tela Hoje: foto do cão ativo; o toque abre o seletor (F11). */
export function CaoAtivo({ name, photoUrl, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. Trocar de cão`}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
    >
      <DogAvatar name={name} uri={photoUrl} size={48} />
      <View>
        <Text variant="subtitle">{name}</Text>
        <Text variant="caption" style={{ color: theme.colors.link }}>
          Meus cães
        </Text>
      </View>
    </Pressable>
  );
}
