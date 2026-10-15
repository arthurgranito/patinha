import { MSG_OFFLINE } from '@/lib/mensagens';
import { useTheme } from '@/lib/theme';

import { Text } from './Text';

/** X.1: aviso ao lado de ações que exigem servidor (que ficam desabilitadas). */
export function OfflineNotice() {
  const theme = useTheme();
  return (
    <Text variant="caption" accessibilityRole="alert" style={{ color: theme.colors.danger }}>
      {MSG_OFFLINE}
    </Text>
  );
}
