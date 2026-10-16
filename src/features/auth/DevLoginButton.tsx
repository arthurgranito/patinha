import { Button } from '@/components/ui/Button';

import { isDevLoginEnabled, signInAsDevUser } from './devLogin';
import type { LoginResult } from './session';

type Props = {
  busy: boolean;
  disabled: boolean;
  run: (action: () => Promise<LoginResult>) => void;
};

/** "Entrar como teste" (Maestro). Só é importado em __DEV__; ver app/(auth)/entrar.tsx. */
export function DevLoginButton({ busy, disabled, run }: Props) {
  if (!isDevLoginEnabled()) return null;
  return (
    <Button
      label="Entrar como teste"
      variant="secondary"
      loading={busy}
      disabled={disabled}
      onPress={() => run(signInAsDevUser)}
    />
  );
}
