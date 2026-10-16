import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OfflineNotice } from '@/components/ui/OfflineNotice';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/lib/theme';
import { useOnline } from '@/lib/useOnline';

import { Checkbox } from './Checkbox';
import { MSG_SALVAR_FALHOU, MSG_SO_ADULTOS, MSG_TENHO_18 } from './mensagens';
import { NOME_MAX, normalizeName, validateDisplayName } from './validacao';

type Props = {
  initialName: string;
  timezone: string;
  onSubmit: (values: { displayName: string; timezone: string }) => Promise<void>;
};

/** F02 — onboarding pessoal: nome, 18+ obrigatório e fuso detectado. */
export function OnboardingForm({ initialName, timezone, onSubmit }: Props) {
  const theme = useTheme();
  const online = useOnline();
  const [name, setName] = useState(initialName);
  const [adult, setAdult] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const error = validateDisplayName(name);
    setNameError(error);
    setSubmitError(null);
    if (error || !adult || !online) return;
    setSaving(true);
    try {
      await onSubmit({ displayName: normalizeName(name), timezone });
    } catch {
      setSubmitError(MSG_SALVAR_FALHOU);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <TextField
        label="Como podemos te chamar?"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (nameError) setNameError(validateDisplayName(text));
        }}
        maxLength={NOME_MAX + 10}
        autoCapitalize="words"
        autoComplete="name"
        error={nameError}
      />

      <View style={{ gap: theme.spacing.xs }}>
        <Checkbox label={MSG_TENHO_18} checked={adult} onChange={setAdult} />
        <Link href="/termos" accessibilityRole="link">
          <Text
            variant="caption"
            style={{ color: theme.colors.link, textDecorationLine: 'underline' }}
          >
            Ler os termos de uso
          </Text>
        </Link>
      </View>

      <Text variant="caption" muted>
        Fuso horário: {timezone.replace(/_/g, ' ')}
      </Text>

      {!adult ? (
        <Text variant="caption" muted>
          {MSG_SO_ADULTOS}
        </Text>
      ) : null}
      {submitError ? (
        <Text variant="caption" style={{ color: theme.colors.danger }}>
          {submitError}
        </Text>
      ) : null}

      {!online ? <OfflineNotice /> : null}
      <Button
        label="Continuar"
        disabled={!adult || !online}
        loading={saving}
        onPress={handleSubmit}
      />
    </View>
  );
}
