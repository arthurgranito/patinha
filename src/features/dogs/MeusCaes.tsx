import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OfflineNotice } from '@/components/ui/OfflineNotice';
import { Text } from '@/components/ui/Text';
import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';
import { useOnline } from '@/lib/useOnline';
import { useTheme } from '@/lib/theme';

import { dogLimitMessage, dogLimitOf, type DogLimit, type DogWithGoals } from './api';
import { DogAvatar } from './DogAvatar';
import { LimiteCaes } from './LimiteCaes';
import {
  msgArquivarConfirma,
  msgExcluirConfirma,
  msgPartiuConfirma,
  msgPartiuOpcao,
} from './mensagens';

export type MeusCaesAcoes = {
  onAdd: () => void;
  onEdit: (dog: DogWithGoals) => void;
  onSetActive: (dog: DogWithGoals) => Promise<void>;
  onArchive: (dog: DogWithGoals) => Promise<void>;
  onPassedAway: (dog: DogWithGoals) => Promise<void>;
  onDelete: (dog: DogWithGoals) => Promise<void>;
  onReactivate: (dog: DogWithGoals) => Promise<void>;
};

type Props = MeusCaesAcoes & {
  dogs: DogWithGoals[];
  photoUrls: Record<string, string>;
  activeDogId: string | null;
  limit: DogLimit | null;
};

/** "Meus cães": F10 (adicionar), F11 (trocar o ativo), F09 (editar) e F12 (arquivar/excluir). */
export function MeusCaes({ dogs, photoUrls, activeDogId, limit, ...acoes }: Props) {
  const theme = useTheme();
  const online = useOnline();
  const [aberto, setAberto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ msg: string; limit: DogLimit | null } | null>(null);
  const [mostrarLimite, setMostrarLimite] = useState(false);
  const [busy, setBusy] = useState(false);

  const ativos = dogs.filter((d) => !d.archived_at);
  const arquivados = dogs.filter((d) => d.archived_at);

  async function rodar(acao: () => Promise<void>) {
    setAviso(null);
    setBusy(true);
    try {
      await acao();
      setAberto(null);
    } catch (e) {
      const l = dogLimitOf(e);
      setAviso({ msg: l ? dogLimitMessage(l) : MSG_ERRO_INESPERADO, limit: l });
    } finally {
      setBusy(false);
    }
  }

  function confirmar(msg: string, label: string, acao: () => Promise<void>) {
    Alert.alert(msg, undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: label, style: 'destructive', onPress: () => void rodar(acao) },
    ]);
  }

  function adicionar() {
    if (limit) setMostrarLimite(true);
    else acoes.onAdd();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        {!online ? <OfflineNotice /> : null}
        {aviso ? (
          aviso.limit ? (
            <LimiteCaes limit={aviso.limit} />
          ) : (
            <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
              {aviso.msg}
            </Text>
          )
        ) : null}

        {ativos.map((dog) => {
          const ativo = dog.id === activeDogId;
          return (
            <View
              key={dog.id}
              style={{
                gap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                borderWidth: ativo ? 2 : 1,
                borderColor: ativo ? theme.colors.primary : theme.colors.border,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={ativo ? `${dog.name}, cão ativo` : `Treinar com ${dog.name}`}
                accessibilityState={{ selected: ativo, disabled: ativo || !online || busy }}
                disabled={ativo || !online || busy}
                onPress={() => void rodar(() => acoes.onSetActive(dog))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
              >
                <DogAvatar name={dog.name} uri={photoUrls[dog.id]} />
                <View style={{ flex: 1 }}>
                  <Text variant="subtitle">{dog.name}</Text>
                  <Text variant="caption" muted>
                    {ativo ? 'Cão ativo' : 'Toque para escolher'}
                  </Text>
                </View>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <Button
                  label="Editar"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => acoes.onEdit(dog)}
                />
                <Button
                  label="⋯"
                  accessibilityLabel={`Mais opções de ${dog.name}`}
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => setAberto(aberto === dog.id ? null : dog.id)}
                />
              </View>
              {aberto === dog.id ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <Button
                    label="Arquivar"
                    variant="secondary"
                    disabled={!online || busy}
                    onPress={() =>
                      confirmar(msgArquivarConfirma(dog.name), 'Arquivar', () =>
                        acoes.onArchive(dog),
                      )
                    }
                  />
                  <Button
                    label={msgPartiuOpcao(dog.name)}
                    variant="secondary"
                    disabled={!online || busy}
                    onPress={() =>
                      confirmar(msgPartiuConfirma(dog.name), 'Confirmar', () =>
                        acoes.onPassedAway(dog),
                      )
                    }
                  />
                  <Button
                    label="Excluir"
                    variant="secondary"
                    disabled={!online || busy}
                    onPress={() =>
                      confirmar(msgExcluirConfirma(dog.name), 'Excluir', () => acoes.onDelete(dog))
                    }
                  />
                </View>
              ) : null}
            </View>
          );
        })}

        {mostrarLimite && limit ? <LimiteCaes limit={limit} /> : null}
        <Button label="+ Adicionar cão" disabled={!online} onPress={adicionar} />

        {arquivados.length > 0 ? (
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="subtitle">Arquivados</Text>
            {arquivados.map((dog) => (
              <View
                key={dog.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
              >
                <DogAvatar name={dog.name} uri={photoUrls[dog.id]} size={44} />
                <Text style={{ flex: 1 }}>{dog.passed_away_at ? `${dog.name} 🌈` : dog.name}</Text>
                {dog.passed_away_at ? (
                  <Text variant="caption" muted>
                    Guardado com carinho
                  </Text>
                ) : (
                  <Button
                    label="Reativar"
                    accessibilityLabel={`Reativar ${dog.name}`}
                    variant="secondary"
                    disabled={!online || busy}
                    onPress={() => void rodar(() => acoes.onReactivate(dog))}
                  />
                )}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
