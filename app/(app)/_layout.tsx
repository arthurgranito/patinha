import { Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { ErrorScreen } from '@/components/ui/ErrorScreen';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { ProfileProvider, useProfile } from '@/features/profile/ProfileProvider';
import { useTheme } from '@/lib/theme';

function AppStack() {
  const theme = useTheme();
  const { profile, loading, error, reload } = useProfile();

  if (loading && !profile) {
    return (
      <Screen centered>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error || !profile) {
    return <ErrorScreen onRetry={reload} />;
  }

  // Sem 18+ confirmado, (abas) e cadastro-cao redirecionam para o onboarding (F02).
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(abas)" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="cadastro-cao" />
    </Stack>
  );
}

// Só é montado com sessão (guarda em app/_layout.tsx).
export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return null;
  return (
    <ProfileProvider key={session.user.id} userId={session.user.id}>
      <AppStack />
    </ProfileProvider>
  );
}
