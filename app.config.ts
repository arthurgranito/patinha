import type { ExpoConfig } from 'expo/config';

// Project ID do EAS (expo.dev → projeto patinha). Público: não é segredo.
const EAS_PROJECT_ID = '3f416ac5-2de9-40e8-a144-751e9a0ce2cd';

// Preview por PR (Fase P): o Expo Go só abre updates com runtime "exposdk:<SDK>",
// então o workflow de preview liga EXPO_GO_PREVIEW=true e publica com a política
// sdkVersion. Builds e updates de verdade continuam com fingerprint.
// TODO(fase 8): com o 1º development build, o preview passa a mirar o canal dele
// (fingerprint) e esta chave sai.
const EXPO_GO_PREVIEW = process.env.EXPO_GO_PREVIEW === 'true';

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
  runtimeVersion: EXPO_GO_PREVIEW ? { policy: 'sdkVersion' } : { policy: 'fingerprint' },
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
    'expo-web-browser',
    'expo-localization',
    [
      'expo-image-picker',
      {
        photosPermission: 'O Patinha usa suas fotos para mostrar o seu cão no app.',
        cameraPermission: 'O Patinha usa a câmera para tirar a foto do seu cão.',
        microphonePermission: false,
      },
    ],
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
