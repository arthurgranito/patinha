import { Redirect, Tabs } from 'expo-router';

import { useProfile } from '@/features/profile/ProfileProvider';
import { useTheme } from '@/lib/theme';

export default function AbasLayout() {
  const theme = useTheme();
  const { profile } = useProfile();

  if (!profile?.is_adult_confirmed) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.link,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: () => null }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: () => null }} />
    </Tabs>
  );
}
