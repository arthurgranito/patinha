import type { ExpoConfig } from 'expo/config';

// Project ID do EAS (expo.dev → projeto patinha). Público: não é segredo.
const EAS_PROJECT_ID = '3f416ac5-2de9-40e8-a144-751e9a0ce2cd';

const config: ExpoConfig = {
  name: 'Patinha',
  slug: 'patinha',
  scheme: 'patinha',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  // Política fingerprint: o runtime muda sozinho quando o código nativo muda,
  // então um EAS Update nunca cai num binário incompatível.
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
  },
  ios: {
    // Placeholder: troque pelo identificador definitivo antes da Fase 14.
    bundleIdentifier: 'app.patinha',
    supportsTablet: false,
  },
  android: {
    // Placeholder: troque pelo identificador definitivo antes da Fase 14.
    package: 'app.patinha',
    adaptiveIcon: {
      backgroundColor: '#FFF4E6',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF4E6',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
};

export default config;
