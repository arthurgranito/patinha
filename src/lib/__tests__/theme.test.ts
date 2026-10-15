import { colors, getTheme, type ColorScheme } from '../theme';

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('theme', () => {
  it('tem as mesmas chaves de cor no claro e no escuro', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('devolve as cores do esquema pedido', () => {
    expect(getTheme('dark').colors).toBe(colors.dark);
    expect(getTheme('light').scheme).toBe('light');
  });

  it.each<ColorScheme>(['light', 'dark'])(
    'respeita o contraste mínimo de 4,5:1 no tema %s (X.5)',
    (scheme) => {
      const c = colors[scheme];
      for (const fg of [c.text, c.textMuted, c.link, c.success, c.danger]) {
        expect(contrast(fg, c.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, c.surface)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
