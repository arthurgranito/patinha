import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/AuthProvider';
import { MSG_ERRO_INESPERADO } from '@/features/profile/mensagens';
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
    // X.3 — erro inesperado. TODO(fase 13): enviar ao Sentry.
    return (
      <Screen centered>
        <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
          <Text style={{ textAlign: 'center' }}>{MSG_ERRO_INESPERADO}</Text>
          <Button label="Tentar de novo" onPress={reload} />
        </View>
      </Screen>
    );
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
