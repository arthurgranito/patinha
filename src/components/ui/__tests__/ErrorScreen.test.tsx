import { fireEvent, render, screen } from '@testing-library/react-native';

import { MSG_ERRO_INESPERADO } from '@/lib/mensagens';

import { RootErrorBoundary as ErrorBoundary } from '../ErrorScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, SafeAreaProvider: View };
});

describe('ErrorBoundary da raiz (X.3)', () => {
  it('mostra a mensagem do X.3 e "Tentar de novo" chama o retry', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText(MSG_ERRO_INESPERADO)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(retry).toHaveBeenCalled();
  });
});
