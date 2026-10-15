import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/features/auth/AuthProvider';
import { updatePreferences } from '@/features/profile/api';
import { ProfileForm } from '@/features/profile/ProfileForm';
import { useProfile } from '@/features/profile/ProfileProvider';
import { detectTimezone } from '@/features/profile/timezone';
import { useTheme } from '@/lib/theme';

// F05 (editar perfil) + F04 (sair).
export default function PerfilScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { profile, setProfile } = useProfile();
  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="title">Perfil</Text>
        <ProfileForm
          profile={profile}
          deviceTimezone={detectTimezone()}
          onSave={async (prefs) => setProfile(await updatePreferences(profile.id, prefs))}
          onSignOut={signOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
