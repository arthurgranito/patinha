import { ScrollView } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/lib/theme';

// Página provisória (F02). O texto definitivo dos termos e da política de privacidade vem na Fase 13/14.
export default function TermosScreen() {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
    >
      <Text variant="subtitle">Termos de uso (versão provisória)</Text>
      <Text>O Patinha é um app de adestramento positivo para tutores maiores de 18 anos.</Text>
      <Text>
        Os treinos usam só reforço positivo. Cada cão aprende no seu ritmo, e o app não promete
        resultados garantidos.
      </Text>
      <Text>
        Em casos de agressividade com mordida, ansiedade severa ou sinais de dor, procure um
        adestrador presencial ou um veterinário.
      </Text>
      <Text>Os dados do seu cão, as fotos e os treinos são privados e só você tem acesso.</Text>
      <Text muted>
        O texto completo dos termos e da política de privacidade será publicado antes do lançamento.
      </Text>
    </ScrollView>
  );
}
