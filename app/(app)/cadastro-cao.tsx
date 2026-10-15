import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useTheme } from '@/lib/theme';

// Tela provisória do F08. TODO(fase 3): cadastro do cão; no F03, quem não tem cão vem para cá.
export default function CadastroCaoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useProfile();
  if (!profile?.is_adult_confirmed) return <Redirect href="/onboarding" />;

  return (
    <Screen centered>
      <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
        <Text variant="subtitle">Cadastro do cão</Text>
        <Text muted>Em breve.</Text>
        <Button label="Ir para o início" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
