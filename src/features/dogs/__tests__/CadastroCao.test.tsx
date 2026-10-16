import { useNetInfo } from '@react-native-community/netinfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MSG_SALVAR_FALHOU } from '@/features/profile/mensagens';
import { MSG_OFFLINE } from '@/lib/mensagens';

import { CadastroCao } from '../CadastroCao';
import { pickDogPhoto } from '../foto';
import {
  MSG_FOTO_FALHOU,
  MSG_INCOMODANDO,
  MSG_LIMITE_GRATIS,
  MSG_LIMITE_PREMIUM,
  MSG_MAIS_CAES_PREMIUM,
  MSG_NOME_CAO_INVALIDO,
  MSG_NOME_CAO_PERGUNTA,
  MSG_SEM_CAMERA,
  MSG_TEMPO_POR_DIA,
  MSG_TRIAGEM_GRAVE,
} from '../mensagens';
import { VIRA_LATA } from '../racas';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('../foto', () => ({ pickDogPhoto: jest.fn() }));

const continuar = () => fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

async function setup(
  onSubmit = jest.fn().mockResolvedValue({ name: 'Caramelo', photoFailed: false }),
) {
  const onDone = jest.fn();
  await render(<CadastroCao onSubmit={onSubmit} onDone={onDone} />);
  return { onSubmit, onDone };
}

/** Vai do nome até a pergunta dos objetivos, sem foto. */
async function ateObjetivos() {
  await fireEvent.changeText(screen.getByLabelText('Nome do cão'), ' Caramelo ');
  await continuar();
  await fireEvent.press(screen.getByRole('button', { name: 'Pular' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Filhote, até 6 meses' }));
  await continuar();
  await fireEvent.press(screen.getByRole('radio', { name: 'Médio' }));
  await continuar();
  await fireEvent.press(screen.getByRole('radio', { name: VIRA_LATA }));
  await continuar();
  await fireEvent.press(screen.getByRole('radio', { name: 'Furacão' }));
  await continuar();
  expect(screen.getByText(MSG_INCOMODANDO)).toBeTruthy();
}

async function ateConcluir() {
  await ateObjetivos();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Xixi no lugar errado' }));
  await continuar();
  expect(screen.getByText(MSG_TEMPO_POR_DIA)).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: '10 minutos' }));
}

afterEach(() => {
  (useNetInfo as jest.Mock).mockReturnValue({ isConnected: true });
  jest.clearAllMocks();
});

describe('CadastroCao (F08)', () => {
  it('começa pelo nome, com a barra de progresso', async () => {
    await setup();
    expect(screen.getByText(MSG_NOME_CAO_PERGUNTA)).toBeTruthy();
    expect(screen.getByLabelText('Passo 1 de 8')).toBeTruthy();
  });

  it.each(['', 'a'.repeat(31)])('1e: nome inválido (%j) não avança', async (nome) => {
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Nome do cão'), nome);
    await continuar();
    expect(screen.getByText(MSG_NOME_CAO_INVALIDO)).toBeTruthy();
    expect(screen.getByText(MSG_NOME_CAO_PERGUNTA)).toBeTruthy();
  });

  it('cadastro completo envia o rascunho e mostra a tela final', async () => {
    const { onSubmit, onDone } = await setup();
    await ateConcluir();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Caramelo',
      photoUri: null,
      ageGroup: 'filhote',
      size: 'medio',
      isSrd: true,
      breed: null,
      energy: 'alta',
      goals: ['xixi'],
      dailyMinutes: 10,
    });
    expect(await screen.findByText('Tudo pronto para treinar com Caramelo 🐾')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ir para o início' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('7a: "Já mordeu alguém e machucou" mostra o aviso de procurar um profissional', async () => {
    const { onSubmit } = await setup();
    await ateObjetivos();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Morde tudo' }));
    // Sem a intensidade não dá para seguir.
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    expect(screen.queryByText(MSG_TRIAGEM_GRAVE)).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Já mordeu alguém e machucou' }));
    expect(screen.getByText(MSG_TRIAGEM_GRAVE)).toBeTruthy();
    await continuar();
    await fireEvent.press(screen.getByRole('radio', { name: '5 minutos' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      goals: ['mordida'],
      severity: { mordida: 'grave' },
    });
  });

  it('7a: intensidade leve segue sem o aviso', async () => {
    await setup();
    await ateObjetivos();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Fica ansioso sozinho' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Chora um pouco' }));
    expect(screen.queryByText(MSG_TRIAGEM_GRAVE)).toBeNull();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  it('2: foto da galeria troca "Pular" por "Continuar"', async () => {
    (pickDogPhoto as jest.Mock).mockResolvedValue({ uri: 'file:///foto.jpg' });
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Nome do cão'), 'Caramelo');
    await continuar();
    expect(screen.getByLabelText('Avatar de Caramelo')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
    expect(await screen.findByLabelText('Foto de Caramelo')).toBeTruthy();
    expect(pickDogPhoto).toHaveBeenCalledWith('galeria');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('2: sem permissão de câmera mostra o aviso', async () => {
    (pickDogPhoto as jest.Mock).mockResolvedValue({ denied: true });
    await setup();
    await fireEvent.changeText(screen.getByLabelText('Nome do cão'), 'Caramelo');
    await continuar();
    await fireEvent.press(screen.getByRole('button', { name: 'Tirar foto' }));
    expect(await screen.findByText(MSG_SEM_CAMERA)).toBeTruthy();
  });

  it('2e: upload que falhou não impede o cadastro e mostra a mensagem', async () => {
    await setup(jest.fn().mockResolvedValue({ name: 'Caramelo', photoFailed: true }));
    await ateConcluir();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText(MSG_FOTO_FALHOU)).toBeTruthy();
    expect(screen.getByText('Tudo pronto para treinar com Caramelo 🐾')).toBeTruthy();
  });

  it('9e: limite do grátis mostra "Mais cães no Premium"', async () => {
    await setup(jest.fn().mockRejectedValue({ code: 'PA001', message: MSG_LIMITE_GRATIS }));
    await ateConcluir();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText(MSG_LIMITE_GRATIS)).toBeTruthy();
    expect(screen.getByText(MSG_MAIS_CAES_PREMIUM)).toBeTruthy();
  });

  it('F10: limite de 5 cães mostra a mensagem do Premium', async () => {
    await setup(jest.fn().mockRejectedValue({ code: 'PA002' }));
    await ateConcluir();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText(MSG_LIMITE_PREMIUM)).toBeTruthy();
  });

  it('erro qualquer ao salvar mostra a mensagem genérica', async () => {
    await setup(jest.fn().mockRejectedValue(new Error('rede')));
    await ateConcluir();
    await fireEvent.press(screen.getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText(MSG_SALVAR_FALHOU)).toBeTruthy();
  });

  it('X.1: offline, "Concluir" fica desabilitado com o aviso', async () => {
    const { onSubmit } = await setup();
    await ateConcluir();
    (useNetInfo as jest.Mock).mockReturnValue({ isConnected: false });
    await fireEvent.press(screen.getByRole('radio', { name: '15 minutos' }));
    expect(screen.getByText(MSG_OFFLINE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('F10: com o limite já atingido, mostra o aviso em vez do cadastro', async () => {
    await render(<CadastroCao limit="gratis" onSubmit={jest.fn()} onDone={jest.fn()} />);
    expect(screen.getByText(MSG_MAIS_CAES_PREMIUM)).toBeTruthy();
    expect(screen.getByText(MSG_LIMITE_GRATIS)).toBeTruthy();
    expect(screen.queryByText(MSG_NOME_CAO_PERGUNTA)).toBeNull();
  });
});
