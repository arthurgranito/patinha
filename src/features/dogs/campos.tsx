import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OptionList } from '@/components/ui/OptionList';
import { Stepper } from '@/components/ui/Stepper';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';
import { useTheme } from '@/lib/theme';

import { DogAvatar } from './DogAvatar';
import { pickDogPhoto } from './foto';
import { MSG_SEM_CAMERA, MSG_TRIAGEM_GRAVE } from './mensagens';
import { AGE_GROUPS, DAILY_MINUTES, ENERGIES, GOALS, SIZES, TRIAGE, type GoalCode } from './opcoes';
import { VIRA_LATA } from './racas';
import type { DogDraft } from './rascunho';
import {
  ageGroupInfo,
  birthMonthFromAge,
  defaultAgeAmount,
  filterBreeds,
  formatAge,
  formatBirthMonth,
  normalizeDogName,
} from './validacao';

type FieldProps = { draft: DogDraft; onChange: (patch: Partial<DogDraft>) => void };

export function CampoNome({ draft, onChange, error }: FieldProps & { error?: string | null }) {
  return (
    <TextField
      label="Nome do cão"
      value={draft.name}
      onChangeText={(name) => onChange({ name })}
      error={error}
      autoCapitalize="words"
      autoCorrect={false}
      maxLength={60}
      returnKeyType="next"
    />
  );
}

/** F08-2: câmera ou galeria. Sem foto, o avatar com a inicial (2a). */
export function CampoFoto({ draft, onChange, currentUrl }: FieldProps & { currentUrl?: string }) {
  const theme = useTheme();
  const [aviso, setAviso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shown = draft.photoUri ?? (draft.removePhoto ? null : currentUrl);

  async function escolher(source: 'camera' | 'galeria') {
    setAviso(null);
    setBusy(true);
    try {
      const r = await pickDogPhoto(source);
      if ('uri' in r) onChange({ photoUri: r.uri, removePhoto: false });
      else if ('denied' in r) setAviso(MSG_SEM_CAMERA);
    } catch {
      setAviso(MSG_ERRO_INESPERADO);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
      <DogAvatar name={draft.name || '?'} uri={shown} size={140} />
      <View style={{ gap: theme.spacing.sm, alignSelf: 'stretch' }}>
        <Button
          label="Tirar foto"
          variant="secondary"
          disabled={busy}
          onPress={() => escolher('camera')}
        />
        <Button
          label="Escolher da galeria"
          variant="secondary"
          disabled={busy}
          onPress={() => escolher('galeria')}
        />
        {shown ? (
          <Button
            label="Remover foto"
            variant="secondary"
            disabled={busy}
            onPress={() => onChange({ photoUri: null, removePhoto: true })}
          />
        ) : null}
      </View>
      {aviso ? (
        <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
          {aviso}
        </Text>
      ) : null}
    </View>
  );
}

export function CampoIdade({ draft, onChange }: FieldProps) {
  const theme = useTheme();
  const group = draft.ageGroup;
  return (
    <View style={{ gap: theme.spacing.md }}>
      <OptionList
        options={AGE_GROUPS.map((g) => ({ value: g.value, label: g.label, hint: g.hint }))}
        selected={group ? [group] : []}
        onToggle={(g) =>
          onChange({ ageGroup: g, ageAmount: defaultAgeAmount(g), ageTouched: true })
        }
      />
      {group ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Stepper
            label="Idade aproximada"
            value={draft.ageAmount}
            min={ageGroupInfo(group).min}
            max={ageGroupInfo(group).max}
            format={(n) => formatAge(group, n)}
            onChange={(ageAmount) => onChange({ ageAmount, ageTouched: true })}
          />
          <Text muted>
            Nasceu por volta de {formatBirthMonth(birthMonthFromAge(group, draft.ageAmount))}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function CampoPorte({ draft, onChange }: FieldProps) {
  return (
    <OptionList
      options={SIZES.map((s) => ({
        value: s.value,
        label: s.label,
        icon: '🐕',
        iconSize: s.scale,
      }))}
      selected={draft.size ? [draft.size] : []}
      onToggle={(size) => onChange({ size })}
    />
  );
}

/** F08-5: "Vira-lata 💛" primeiro, depois a busca na lista local. */
export function CampoRaca({ draft, onChange }: FieldProps) {
  const theme = useTheme();
  const [busca, setBusca] = useState('');
  const encontradas = filterBreeds(busca);
  const digitada = normalizeDogName(busca).slice(0, 60);
  const outra =
    digitada && !encontradas.some((r) => r.toLowerCase() === digitada.toLowerCase())
      ? digitada
      : null;
  const selecionada = draft.isSrd ? VIRA_LATA : draft.breed;
  const opcoes = [VIRA_LATA, ...(outra ? [outra] : []), ...encontradas];
  // A raça já gravada aparece mesmo fora da busca (edição).
  if (draft.breed && !draft.isSrd && !opcoes.includes(draft.breed))
    opcoes.splice(1, 0, draft.breed);

  return (
    <View style={{ gap: theme.spacing.md }}>
      <TextField
        label="Buscar raça"
        value={busca}
        onChangeText={setBusca}
        autoCorrect={false}
        placeholder="Ex.: Labrador"
      />
      <OptionList
        options={opcoes.map((r) => ({
          value: r,
          label: r === outra ? `Outra: ${r}` : r,
        }))}
        selected={selecionada ? [selecionada] : []}
        onToggle={(r) =>
          onChange(r === VIRA_LATA ? { isSrd: true, breed: null } : { isSrd: false, breed: r })
        }
      />
    </View>
  );
}

export function CampoEnergia({ draft, onChange }: FieldProps) {
  return (
    <OptionList
      options={ENERGIES.map((e) => ({ value: e.value, label: e.label, icon: e.icon }))}
      selected={draft.energy ? [draft.energy] : []}
      onToggle={(energy) => onChange({ energy })}
    />
  );
}

/** F08-7 com a triagem do 7a (ADR-07). */
export function CampoObjetivos({ draft, onChange }: FieldProps) {
  const theme = useTheme();

  function toggle(g: GoalCode) {
    if (draft.goals.includes(g)) {
      const severity = { ...draft.severity };
      delete severity[g];
      onChange({ goals: draft.goals.filter((x) => x !== g), severity });
    } else {
      onChange({ goals: [...draft.goals, g] });
    }
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text muted>Pode marcar vários.</Text>
      <OptionList
        multiple
        options={GOALS.map((g) => ({ value: g.value, label: g.label, icon: g.icon }))}
        selected={draft.goals}
        onToggle={toggle}
      />
      {GOALS.filter((g) => TRIAGE[g.value] && draft.goals.includes(g.value)).map((g) => (
        <Triagem
          key={g.value}
          goal={g.value}
          label={g.label}
          value={draft.severity[g.value]}
          onChange={(v) => onChange({ severity: { ...draft.severity, [g.value]: v } })}
        />
      ))}
    </View>
  );
}

function Triagem({
  goal,
  label,
  value,
  onChange,
}: {
  goal: GoalCode;
  label: string;
  value: 'leve' | 'grave' | undefined;
  onChange: (v: 'leve' | 'grave') => void;
}) {
  const theme = useTheme();
  const textos = TRIAGE[goal]!;
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="subtitle">“{label}”: qual a intensidade?</Text>
      <OptionList
        options={[
          { value: 'leve' as const, label: textos.leve },
          { value: 'grave' as const, label: textos.grave },
        ]}
        selected={value ? [value] : []}
        onToggle={onChange}
      />
      {value === 'grave' ? (
        <View
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.danger,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text accessibilityRole="alert">{MSG_TRIAGEM_GRAVE}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function CampoTempo({ draft, onChange }: FieldProps) {
  return (
    <OptionList
      options={DAILY_MINUTES.map((m) => ({ value: m, label: `${m} minutos` }))}
      selected={draft.dailyMinutes ? [draft.dailyMinutes] : []}
      onToggle={(dailyMinutes) => onChange({ dailyMinutes })}
    />
  );
}
