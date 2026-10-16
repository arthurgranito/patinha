import { useNetInfo } from '@react-native-community/netinfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { MSG_OFFLINE } from '@/lib/mensagens';

import { MSG_NOME_INVALIDO, MSG_SALVAR_FALHOU, MSG_SO_ADULTOS, MSG_TENHO_18 } from '../mensagens';
import { OnboardingForm } from '../OnboardingForm';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

async function setup(onSubmit = jest.fn().mockResolvedValue(undefined)) {
  await render(
    <OnboardingForm initialName="Ana Souza" timezone="America/Sao_Paulo" onSubmit={onSubmit} />,
  );
  return { onSubmit, button: () => screen.getByRole('button', { name: 'Continuar' }) };
}

afterEach(() => (useNetInfo as jest.Mock).mockReturnValue({ isConnected: true }));

describe('OnboardingForm (F02)', () => {
  it('vem com o nome do provedor e o fuso detectado', async () => {
    await setup();
    expect(screen.getByDisplayValue('Ana Souza')).toBeTruthy();
    expect(screen.getByText('Fuso horário: America/Sao Paulo')).toBeTruthy();
    expect(screen.getByText('Ler os termos de uso')).toBeTruthy();
  });

  it('1e: sem marcar 18+ o botão fica desabilitado, com a dica', async () => {
    const { onSubmit, button } = await setup();
    expect(screen.getByText(MSG_SO_ADULTOS)).toBeTruthy();
    expect(button()).toBeDisabled();
    await fireEvent.press(button());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marcando 18+ libera o botão e envia nome e fuso', async () => {
    const { onSubmit, button } = await setup();
    await fireEvent.press(screen.getByRole('checkbox', { name: MSG_TENHO_18 }));
    expect(screen.queryByText(MSG_SO_ADULTOS)).toBeNull();
    expect(button()).toBeEnabled();
    await fireEvent.changeText(screen.getByDisplayValue('Ana Souza'), '  Ana  ');
    await fireEvent.press(button());
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ displayName: 'Ana', timezone: 'America/Sao_Paulo' }),
    );
  });

  it.each(['', 'a'.repeat(41)])(
    '1e: nome inválido (%j) mostra a mensagem e não envia',
    async (name) => {
      const { onSubmit, button } = await setup();
      await fireEvent.press(screen.getByRole('checkbox', { name: MSG_TENHO_18 }));
      await fireEvent.changeText(screen.getByDisplayValue('Ana Souza'), name);
      await fireEvent.press(button());
      expect(await screen.findByText(MSG_NOME_INVALIDO)).toBeTruthy();
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it('X.1: offline, Continuar fica desabilitado com "Você está offline"', async () => {
    (useNetInfo as jest.Mock).mockReturnValue({ isConnected: false });
    const { onSubmit, button } = await setup();
    await fireEvent.press(screen.getByRole('checkbox', { name: MSG_TENHO_18 }));
    expect(screen.getByText(MSG_OFFLINE)).toBeTruthy();
    expect(button()).toBeDisabled();
    await fireEvent.press(button());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('falha ao salvar mostra a mensagem de tentar de novo', async () => {
    const { button } = await setup(jest.fn().mockRejectedValue(new Error('rede')));
    await fireEvent.press(screen.getByRole('checkbox', { name: MSG_TENHO_18 }));
    await fireEvent.press(button());
    expect(await screen.findByText(MSG_SALVAR_FALHOU)).toBeTruthy();
  });
});
