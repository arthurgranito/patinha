import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import type { DogWithGoals } from '../api';
import {
  MSG_LIMITE_GRATIS,
  MSG_MAIS_CAES_PREMIUM,
  msgArquivarConfirma,
  msgExcluirConfirma,
  msgPartiuConfirma,
} from '../mensagens';
import { MeusCaes, type MeusCaesAcoes } from '../MeusCaes';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

const base: Omit<DogWithGoals, 'id' | 'name'> = {
  owner_id: 'u1',
  photo_path: null,
  birth_month: '2022-01-01',
  size: 'medio',
  breed: null,
  is_srd: true,
  energy: 'alta',
  daily_minutes: 10,
  archived_at: null,
  passed_away_at: null,
  created_at: '2026-10-01T00:00:00Z',
  dog_goals: [],
};
const caramelo = { ...base, id: 'd1', name: 'Caramelo' };
const pipoca = { ...base, id: 'd2', name: 'Pipoca' };
const thor = { ...base, id: 'd3', name: 'Thor', archived_at: '2026-10-02T00:00:00Z' };
const bidu = {
  ...base,
  id: 'd4',
  name: 'Bidu',
  archived_at: '2026-10-02T00:00:00Z',
  passed_away_at: '2026-10-02T00:00:00Z',
};

function acoes(): jest.Mocked<MeusCaesAcoes> {
  return {
    onAdd: jest.fn(),
    onEdit: jest.fn(),
    onSetActive: jest.fn().mockResolvedValue(undefined),
    onArchive: jest.fn().mockResolvedValue(undefined),
    onPassedAway: jest.fn().mockResolvedValue(undefined),
    onDelete: jest.fn().mockResolvedValue(undefined),
    onReactivate: jest.fn().mockResolvedValue(undefined),
  };
}

/** Confirma o Alert.alert com o botão de rótulo dado. */
async function confirmarAlert(label: string) {
  const spy = Alert.alert as jest.Mock;
  const buttons = spy.mock.calls.at(-1)?.[2] as { text: string; onPress?: () => void }[];
  await act(async () => buttons.find((b) => b.text === label)?.onPress?.());
}

beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

async function setup(dogs: DogWithGoals[], limit: 'gratis' | 'premium' | null = null) {
  const a = acoes();
  await render(<MeusCaes dogs={dogs} photoUrls={{}} activeDogId="d1" limit={limit} {...a} />);
  return a;
}

describe('MeusCaes', () => {
  it('lista os cães com avatar e marca o ativo', async () => {
    await setup([caramelo, pipoca]);
    expect(screen.getByLabelText('Caramelo, cão ativo')).toBeTruthy();
    expect(screen.getByLabelText('Avatar de Pipoca')).toBeTruthy();
  });

  it('F11: toque em outro cão troca o ativo', async () => {
    const a = await setup([caramelo, pipoca]);
    await fireEvent.press(screen.getByRole('button', { name: 'Treinar com Pipoca' }));
    await waitFor(() => expect(a.onSetActive).toHaveBeenCalledWith(pipoca));
  });

  it('F10: no grátis com 1 cão, o "+" mostra "Mais cães no Premium"', async () => {
    const a = await setup([caramelo], 'gratis');
    expect(screen.queryByText(MSG_MAIS_CAES_PREMIUM)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '+ Adicionar cão' }));
    expect(screen.getByText(MSG_MAIS_CAES_PREMIUM)).toBeTruthy();
    expect(screen.getByText(MSG_LIMITE_GRATIS)).toBeTruthy();
    expect(a.onAdd).not.toHaveBeenCalled();
  });

  it('sem limite, o "+" abre o cadastro', async () => {
    const a = await setup([caramelo]);
    await fireEvent.press(screen.getByRole('button', { name: '+ Adicionar cão' }));
    expect(a.onAdd).toHaveBeenCalled();
  });

  it('F12: arquivar pede confirmação com o texto do fluxo', async () => {
    const a = await setup([caramelo]);
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções de Caramelo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Arquivar' }));
    expect(Alert.alert).toHaveBeenCalledWith(
      msgArquivarConfirma('Caramelo'),
      undefined,
      expect.any(Array),
    );
    expect(msgArquivarConfirma('Caramelo')).toBe(
      'Arquivar o Caramelo? O histórico fica guardado e você pode reativar depois.',
    );
    await confirmarAlert('Arquivar');
    await waitFor(() => expect(a.onArchive).toHaveBeenCalledWith(caramelo));
  });

  it('F12: excluir pede confirmação com o texto do fluxo', async () => {
    const a = await setup([caramelo]);
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções de Caramelo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
    expect(msgExcluirConfirma('Caramelo')).toBe(
      'Excluir para sempre o Caramelo e todo o histórico de treino?',
    );
    await confirmarAlert('Cancelar');
    expect(a.onDelete).not.toHaveBeenCalled();
    await confirmarAlert('Excluir');
    await waitFor(() => expect(a.onDelete).toHaveBeenCalledWith(caramelo));
  });

  it('F12: "O Caramelo partiu 🌈" confirma com carinho', async () => {
    const a = await setup([caramelo]);
    await fireEvent.press(screen.getByRole('button', { name: 'Mais opções de Caramelo' }));
    await fireEvent.press(screen.getByRole('button', { name: 'O Caramelo partiu 🌈' }));
    expect(Alert.alert).toHaveBeenCalledWith(
      msgPartiuConfirma('Caramelo'),
      undefined,
      expect.any(Array),
    );
    await confirmarAlert('Confirmar');
    await waitFor(() => expect(a.onPassedAway).toHaveBeenCalledWith(caramelo));
  });

  it('arquivados: reativar respeita o limite; quem partiu não tem "Reativar"', async () => {
    const a = await setup([caramelo, thor, bidu]);
    a.onReactivate.mockRejectedValue({ code: 'PA001' });
    expect(screen.queryByRole('button', { name: 'Reativar Bidu' })).toBeNull();
    expect(screen.getByText('Bidu 🌈')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Reativar Thor' }));
    expect(await screen.findByText(MSG_LIMITE_GRATIS)).toBeTruthy();
    expect(screen.getByText(MSG_MAIS_CAES_PREMIUM)).toBeTruthy();
  });
});
