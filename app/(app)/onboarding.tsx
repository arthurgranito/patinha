import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { completeOnboarding } from '@/features/profile/api';
import { OnboardingForm } from '@/features/profile/OnboardingForm';
import { useProfile } from '@/features/profile/ProfileProvider';
import { detectTimezone } from '@/features/profile/timezone';
import { useTheme } from '@/lib/theme';

// F02 — onboarding pessoal. Depois vai para o cadastro do cão (F08, provisório).
export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, setProfile } = useProfile();
  const [finished, setFinished] = useState(false);

  if (!profile) return null;
  if (profile.is_adult_confirmed && !finished) return <Redirect href="/" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="title">Boas-vindas ao Patinha!</Text>
        <Text muted>Antes de começar, confirme seus dados.</Text>
        <OnboardingForm
          initialName={profile.display_name}
          timezone={detectTimezone()}
          onSubmit={async (values) => {
            const updated = await completeOnboarding(profile.id, values);
            setFinished(true);
            setProfile(updated);
            router.replace('/cadastro-cao');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
