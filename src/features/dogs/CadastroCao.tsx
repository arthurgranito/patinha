import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OfflineNotice } from '@/components/ui/OfflineNotice';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { MSG_SALVAR_FALHOU } from '@/features/profile/mensagens';
import { useOnline } from '@/lib/useOnline';
import { useTheme } from '@/lib/theme';

import { dogLimitMessage, dogLimitOf, type DogLimit } from './api';
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
import { LimiteCaes } from './LimiteCaes';
import {
  MSG_FOTO_FALHOU,
  MSG_INCOMODANDO,
  MSG_NOME_CAO_PERGUNTA,
  MSG_TEMPO_POR_DIA,
  msgTudoPronto,
} from './mensagens';
import { campoCompleto, EMPTY_DRAFT, type Campo, type DogDraft } from './rascunho';
import { normalizeDogName, validateDogName } from './validacao';

export type CadastroResultado = { name: string; photoFailed: boolean };

type Props = {
  /** Cria o cão (e envia a foto). Erros de limite (PA001/PA002) viram a mensagem do F08-9e. */
  onSubmit: (draft: DogDraft) => Promise<CadastroResultado>;
  onDone: () => void;
  /** Existe outro cão ativo: o 1º passo ganha "Cancelar". */
  onCancel?: () => void;
  /** Sem cão ativo, mas com arquivados que podem voltar (F12). */
  onReactivate?: () => void;
  /** Limite já atingido antes de começar (F10). */
  limit?: DogLimit | null;
};

const PASSOS: { campo: Campo; titulo: string }[] = [
  { campo: 'nome', titulo: MSG_NOME_CAO_PERGUNTA },
  { campo: 'foto', titulo: 'Uma foto para o perfil' },
  { campo: 'idade', titulo: 'Qual a idade?' },
  { campo: 'porte', titulo: 'Qual o porte?' },
  { campo: 'raca', titulo: 'Qual a raça?' },
  { campo: 'energia', titulo: 'Como é a energia no dia a dia?' },
  { campo: 'objetivos', titulo: MSG_INCOMODANDO },
  { campo: 'tempo', titulo: MSG_TEMPO_POR_DIA },
];

/** F08 — cadastro do cão, uma pergunta por tela. */
export function CadastroCao({ onSubmit, onDone, onCancel, onReactivate, limit }: Props) {
  const theme = useTheme();
  const online = useOnline();
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<DogDraft>(EMPTY_DRAFT);
  const [nomeErro, setNomeErro] = useState<string | null>(null);
  const [erro, setErro] = useState<{ msg: string; limit: DogLimit | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pronto, setPronto] = useState<CadastroResultado | null>(null);

  if (pronto) {
    return (
      <Moldura>
        <Text variant="title">{msgTudoPronto(pronto.name)}</Text>
        {pronto.photoFailed ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {MSG_FOTO_FALHOU}
          </Text>
        ) : null}
        {/* TODO(fase 5): F13 gera o plano e esta tela vira "O plano do Caramelo está pronto 🐾". */}
        <Text muted>Logo, logo o plano de treino aparece aqui.</Text>
        <Button label="Ir para o início" onPress={onDone} />
      </Moldura>
    );
  }

  // Depois do pronto: o próprio cadastro faz o limite ser atingido.
  if (limit) {
    return (
      <Moldura>
        <LimiteCaes limit={limit} />
        {onCancel ? <Button label="Voltar" variant="secondary" onPress={onCancel} /> : null}
      </Moldura>
    );
  }

  const passo = PASSOS[index]!;
  const ultimo = index === PASSOS.length - 1;
  const change = (patch: Partial<DogDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    if (patch.name !== undefined) setNomeErro(null);
    setErro(null);
  };

  async function avancar() {
    if (passo.campo === 'nome') {
      const e = validateDogName(draft.name);
      setNomeErro(e);
      if (e) return;
    }
    if (!ultimo) {
      setIndex(index + 1);
      return;
    }
    setSaving(true);
    try {
      setPronto(await onSubmit({ ...draft, name: normalizeDogName(draft.name) }));
    } catch (e) {
      const l = dogLimitOf(e);
      setErro({ msg: l ? dogLimitMessage(l) : MSG_SALVAR_FALHOU, limit: l });
    } finally {
      setSaving(false);
    }
  }

  const completo = campoCompleto(passo.campo, draft);
  const rotulo = ultimo
    ? 'Concluir'
    : passo.campo === 'foto' && !draft.photoUri
      ? 'Pular'
      : 'Continuar';

  return (
    <Moldura>
      <ProgressBar step={index + 1} total={PASSOS.length} />
      <Text variant="caption" muted>
        Passo {index + 1} de {PASSOS.length}
      </Text>
      <Text variant="title">{passo.titulo}</Text>

      {passo.campo === 'nome' ? (
        <CampoNome draft={draft} onChange={change} error={nomeErro} />
      ) : null}
      {passo.campo === 'foto' ? <CampoFoto draft={draft} onChange={change} /> : null}
      {passo.campo === 'idade' ? <CampoIdade draft={draft} onChange={change} /> : null}
      {passo.campo === 'porte' ? <CampoPorte draft={draft} onChange={change} /> : null}
      {passo.campo === 'raca' ? <CampoRaca draft={draft} onChange={change} /> : null}
      {passo.campo === 'energia' ? <CampoEnergia draft={draft} onChange={change} /> : null}
      {passo.campo === 'objetivos' ? <CampoObjetivos draft={draft} onChange={change} /> : null}
      {passo.campo === 'tempo' ? <CampoTempo draft={draft} onChange={change} /> : null}

      {erro ? (
        erro.limit ? (
          <LimiteCaes limit={erro.limit} />
        ) : (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {erro.msg}
          </Text>
        )
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        {ultimo && !online ? <OfflineNotice /> : null}
        <Button
          label={rotulo}
          loading={saving}
          disabled={(passo.campo !== 'nome' && !completo) || (ultimo && !online)}
          onPress={avancar}
        />
        {index > 0 ? (
          <Button label="Voltar" variant="secondary" onPress={() => setIndex(index - 1)} />
        ) : onCancel ? (
          <Button label="Cancelar" variant="secondary" onPress={onCancel} />
        ) : null}
        {index === 0 && onReactivate ? (
          <Button label="Reativar um cão arquivado" variant="secondary" onPress={onReactivate} />
        ) : null}
      </View>
    </Moldura>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
