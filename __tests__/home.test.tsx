import { fireEvent, render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/(app)/(abas)/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/features/dogs/DogsProvider', () => ({
  useDogs: () => ({ activeDog: { id: 'd1', name: 'Caramelo' }, photoUrls: {} }),
}));

describe('HomeScreen', () => {
  it('mostra o cão ativo no topo e o aviso de em construção', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('Caramelo')).toBeTruthy();
    expect(screen.getByText('Patinha 🐾 — em construção')).toBeTruthy();
  });

  it('F11: tocar no cão abre "Meus cães"', async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Caramelo. Trocar de cão' }));
    expect(mockPush).toHaveBeenCalledWith('/caes');
  });
});
