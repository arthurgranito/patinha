import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OfflineNotice } from '@/components/ui/OfflineNotice';
import { Text } from '@/components/ui/Text';
import { MSG_SALVAR_FALHOU } from '@/features/profile/mensagens';
import { useOnline } from '@/lib/useOnline';
import { useTheme } from '@/lib/theme';

import type { DogWithGoals } from './api';
import {
  CampoEnergia,
  CampoFoto,
  CampoIdade,
  CampoNome,
  CampoObjetivos,
  CampoPorte,
  CampoRaca,
  CampoTempo,
} from './campos';
import { MSG_FOTO_FALHOU, MSG_INCOMODANDO, MSG_TEMPO_POR_DIA } from './mensagens';
import { campoCompleto, draftFromDog, type Campo, type DogDraft } from './rascunho';
import { validateDogName } from './validacao';

type Props = {
  dog: DogWithGoals;
  photoUrl?: string;
  onSave: (draft: DogDraft) => Promise<{ photoFailed: boolean }>;
  onDone: () => void;
};

const CAMPOS: Campo[] = ['nome', 'foto', 'idade', 'porte', 'raca', 'energia', 'objetivos', 'tempo'];

/** F09 — editar qualquer campo do F08 numa tela só. */
export function EditarCao({ dog, photoUrl, onSave, onDone }: Props) {
  const theme = useTheme();
  const online = useOnline();
  const [draft, setDraft] = useState<DogDraft>(() => draftFromDog(dog));
  const [nomeErro, setNomeErro] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const change = (patch: Partial<DogDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (patch.name !== undefined) setNomeErro(null);
    setErro(null);
  };
  const completo = CAMPOS.every((c) => c === 'nome' || campoCompleto(c, draft));

  async function salvar() {
    const e = validateDogName(draft.name);
    setNomeErro(e);
    if (e) return;
    setSaving(true);
    try {
      const r = await onSave(draft);
      if (r.photoFailed) setErro(MSG_FOTO_FALHOU);
      else onDone();
    } catch {
      setErro(MSG_SALVAR_FALHOU);
    } finally {
      setSaving(false);
    }
  }

  const secao = (titulo: string, campo: ReactNode) => (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="subtitle">{titulo}</Text>
      {campo}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <CampoNome draft={draft} onChange={change} error={nomeErro} />
        {secao('Foto', <CampoFoto draft={draft} onChange={change} currentUrl={photoUrl} />)}
        {secao('Idade', <CampoIdade draft={draft} onChange={change} />)}
        {secao('Porte', <CampoPorte draft={draft} onChange={change} />)}
        {secao('Raça', <CampoRaca draft={draft} onChange={change} />)}
        {secao('Energia', <CampoEnergia draft={draft} onChange={change} />)}
        {secao(MSG_INCOMODANDO, <CampoObjetivos draft={draft} onChange={change} />)}
        {secao(MSG_TEMPO_POR_DIA, <CampoTempo draft={draft} onChange={change} />)}

        {erro ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {erro}
          </Text>
        ) : null}
        <View style={{ gap: theme.spacing.sm }}>
          {!online ? <OfflineNotice /> : null}
          <Button
            label="Salvar"
            loading={saving}
            disabled={!completo || !online}
            onPress={salvar}
          />
          {erro === MSG_FOTO_FALHOU ? (
            <Button label="Continuar sem a foto" variant="secondary" onPress={onDone} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
