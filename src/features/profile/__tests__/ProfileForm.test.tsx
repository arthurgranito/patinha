import { useNetInfo } from '@react-native-community/netinfo';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { MSG_OFFLINE } from '@/lib/mensagens';

import type { Profile } from '../api';
import { MSG_SAIR_CONFIRMA, MSG_SALVAR_FALHOU, MSG_VALE_DAQUI_PRA_FRENTE } from '../mensagens';
import { ProfileForm } from '../ProfileForm';

const profile: Profile = {
  id: '11111111-1111-1111-1111-111111111111',
  display_name: 'Ana',
  timezone: 'America/Sao_Paulo',
  day_cutoff_hour: 4,
  reminder_hour: 19,
  is_adult_confirmed: true,
  adult_confirmed_at: '2026-10-15T12:00:00Z',
  active_dog_id: null,
  created_at: '2026-10-15T12:00:00Z',
};

async function setup(onSave = jest.fn().mockResolvedValue(undefined), onSignOut = jest.fn()) {
  await render(
    <ProfileForm
      profile={profile}
      deviceTimezone="America/Sao_Paulo"
      onSave={onSave}
      onSignOut={onSignOut}
    />,
  );
  return { onSave, onSignOut };
}

describe('ProfileForm (F05)', () => {
  it('sem mudanças, Salvar fica desabilitado e não há aviso', async () => {
    await setup();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(screen.queryByText(MSG_VALE_DAQUI_PRA_FRENTE)).toBeNull();
  });

  it('mudar a virada do dia mostra o aviso e salva só as colunas permitidas', async () => {
    const { onSave } = await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Aumentar virada do dia' }));
    expect(screen.getByText(MSG_VALE_DAQUI_PRA_FRENTE)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        display_name: 'Ana',
        timezone: 'America/Sao_Paulo',
        day_cutoff_hour: 5,
        reminder_hour: 19,
      }),
    );
    expect(await screen.findByText('Salvo.')).toBeTruthy();
  });

  it('mudar o fuso mostra o aviso', async () => {
    await setup();
    await fireEvent.press(
      screen.getByRole('radio', { name: 'Horário do Amazonas (AM, RO, RR, MT, MS)' }),
    );
    expect(screen.getByText(MSG_VALE_DAQUI_PRA_FRENTE)).toBeTruthy();
  });

  it('mudar só o lembrete não mostra o aviso', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Diminuir horário do lembrete' }));
    expect(screen.queryByText(MSG_VALE_DAQUI_PRA_FRENTE)).toBeNull();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
  });

  it('virada do dia não passa de 6h', async () => {
    await setup();
    const mais = screen.getByRole('button', { name: 'Aumentar virada do dia' });
    await fireEvent.press(mais);
    await fireEvent.press(mais);
    expect(screen.getByText('6h')).toBeTruthy();
    expect(mais).toBeDisabled();
  });

  it('X.1: offline, Salvar fica desabilitado com "Você está offline"', async () => {
    (useNetInfo as jest.Mock).mockReturnValue({ isConnected: false });
    try {
      await setup();
      await fireEvent.changeText(screen.getByDisplayValue('Ana'), 'Ana Souza');
      expect(screen.getByText(MSG_OFFLINE)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    } finally {
      (useNetInfo as jest.Mock).mockReturnValue({ isConnected: true });
    }
  });

  it('falha de rede ao salvar', async () => {
    await setup(jest.fn().mockRejectedValue(new Error('rede')));
    await fireEvent.changeText(screen.getByDisplayValue('Ana'), 'Ana Souza');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText(MSG_SALVAR_FALHOU)).toBeTruthy();
  });

  it('F04: Sair pede confirmação e só sai ao confirmar', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const { onSignOut } = await setup();
    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(alert).toHaveBeenCalledWith(MSG_SAIR_CONFIRMA, undefined, expect.any(Array));
    expect(onSignOut).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.text === 'Sair')?.onPress?.());
    expect(onSignOut).toHaveBeenCalled();
  });
});
