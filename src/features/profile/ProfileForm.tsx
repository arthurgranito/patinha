import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/lib/theme';

import type { Profile, ProfilePreferences } from './api';
import { MSG_SAIR_CONFIRMA, MSG_SALVAR_FALHOU, MSG_VALE_DAQUI_PRA_FRENTE } from './mensagens';
import { timezoneOptions } from './timezone';
import { NOME_MAX, formatHour, normalizeName, validateDisplayName } from './validacao';

type Props = {
  profile: Profile;
  deviceTimezone: string;
  onSave: (prefs: ProfilePreferences) => Promise<void>;
  onSignOut: () => void;
};

/** F05 (editar perfil e preferências) + F04 (sair). */
export function ProfileForm({ profile, deviceTimezone, onSave, onSignOut }: Props) {
  const theme = useTheme();
  const [name, setName] = useState(profile.display_name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [cutoff, setCutoff] = useState(profile.day_cutoff_hour);
  const [reminder, setReminder] = useState(profile.reminder_hour);
  const [nameError, setNameError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saving, setSaving] = useState(false);

  const dayRuleChanged = timezone !== profile.timezone || cutoff !== profile.day_cutoff_hour;
  const dirty =
    dayRuleChanged ||
    normalizeName(name) !== profile.display_name ||
    reminder !== profile.reminder_hour;

  async function handleSave() {
    const error = validateDisplayName(name);
    setNameError(error);
    if (error) return;
    setSaving(true);
    setStatus('idle');
    try {
      await onSave({
        display_name: normalizeName(name),
        timezone,
        day_cutoff_hour: cutoff,
        reminder_hour: reminder,
      });
      setStatus('saved');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function confirmSignOut() {
    Alert.alert(MSG_SAIR_CONFIRMA, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: onSignOut },
    ]);
  }

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <TextField
        label="Seu nome"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setStatus('idle');
          if (nameError) setNameError(validateDisplayName(text));
        }}
        maxLength={NOME_MAX + 10}
        autoCapitalize="words"
        error={nameError}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="caption" muted>
          Fuso horário
        </Text>
        {timezoneOptions(profile.timezone, deviceTimezone).map((option) => {
          const selected = option.id === timezone;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => {
                setTimezone(option.id);
                setStatus('idle');
              }}
              style={{
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text>{option.label}</Text>
              {option.id === deviceTimezone ? (
                <Text variant="caption" muted>
                  Fuso deste aparelho
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: theme.spacing.xs }}>
        <Stepper
          label="Virada do dia"
          value={cutoff}
          min={0}
          max={6}
          format={formatHour}
          onChange={(value) => {
            setCutoff(value);
            setStatus('idle');
          }}
        />
        <Text variant="caption" muted>
          O dia de treino vira às {formatHour(cutoff)}. Treinar antes disso conta para o dia
          anterior.
        </Text>
      </View>

      <Stepper
        label="Horário do lembrete"
        value={reminder}
        min={0}
        max={23}
        format={formatHour}
        onChange={(value) => {
          setReminder(value);
          setStatus('idle');
        }}
      />

      {dayRuleChanged ? (
        <Text variant="caption" style={{ color: theme.colors.link }}>
          {MSG_VALE_DAQUI_PRA_FRENTE}
        </Text>
      ) : null}
      {status === 'error' ? (
        <Text variant="caption" style={{ color: theme.colors.danger }}>
          {MSG_SALVAR_FALHOU}
        </Text>
      ) : null}
      {status === 'saved' ? (
        <Text variant="caption" style={{ color: theme.colors.success }}>
          Salvo.
        </Text>
      ) : null}

      <Button label="Salvar" disabled={!dirty} loading={saving} onPress={handleSave} />
      <Button label="Sair" variant="secondary" onPress={confirmSignOut} />
    </View>
  );
}
