import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/(app)/index';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

describe('HomeScreen', () => {
  it('mostra o aviso de em construção', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('Patinha 🐾 — em construção')).toBeTruthy();
  });
});
