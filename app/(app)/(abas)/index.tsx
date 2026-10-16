import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { CaoAtivo } from '@/features/dogs/CaoAtivo';
import { useDogs } from '@/features/dogs/DogsProvider';
import { useTheme } from '@/lib/theme';

// Hoje. TODO(fase 5): treino do dia (F17).
export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { activeDog, photoUrls } = useDogs();

  return (
    <Screen>
      {activeDog ? (
        <CaoAtivo
          name={activeDog.name}
          photoUrl={photoUrls[activeDog.id]}
          onPress={() => router.push('/caes')}
        />
      ) : null}
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}
      >
        <Text variant="title">Patinha 🐾 — em construção</Text>
      </View>
    </Screen>
  );
}
