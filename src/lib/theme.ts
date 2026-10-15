import { useColorScheme } from 'react-native';

const palette = {
  caramelo: '#E8913A',
  carameloEscuro: '#B8691F',
  creme: '#FFF4E6',
  grafite: '#1F1B16',
  grafiteClaro: '#2B2620',
  cinza: '#6B645C',
  cinzaClaro: '#B5ADA3',
  carameloTexto: '#9A5512',
  verde: '#2E9D5B',
  verdeEscuro: '#237A46',
  vermelho: '#C9483B',
  vermelhoEscuro: '#A33A2F',
  branco: '#FFFFFF',
} as const;

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  /** Links e destaques em texto (contraste ≥ 4,5:1 com background e surface, X.5). */
  link: string;
  success: string;
  danger: string;
  border: string;
};

export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: palette.creme,
    surface: palette.branco,
    text: palette.grafite,
    textMuted: palette.cinza,
    primary: palette.caramelo,
    // Grafite sobre caramelo: 6,96:1 (branco dava 2,46:1, abaixo do mínimo do X.5).
    onPrimary: palette.grafite,
    link: palette.carameloTexto,
    success: palette.verdeEscuro,
    danger: palette.vermelhoEscuro,
    border: '#EADBC8',
  },
  dark: {
    background: palette.grafite,
    surface: palette.grafiteClaro,
    text: palette.creme,
    textMuted: palette.cinzaClaro,
    primary: palette.caramelo,
    onPrimary: palette.grafite,
    link: palette.caramelo,
    success: '#4CC27F',
    danger: '#E2695D',
    border: '#3A332B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export function getTheme(scheme: ColorScheme): Theme {
  return { scheme, colors: colors[scheme], spacing, radius, typography };
}

export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return getTheme(scheme);
}
