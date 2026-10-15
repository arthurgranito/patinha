import { colors, getTheme } from '../theme';

describe('theme', () => {
  it('tem as mesmas chaves de cor no claro e no escuro', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('devolve as cores do esquema pedido', () => {
    expect(getTheme('dark').colors).toBe(colors.dark);
    expect(getTheme('light').scheme).toBe('light');
  });
});
