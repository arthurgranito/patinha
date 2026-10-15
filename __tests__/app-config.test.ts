import type { ExpoConfig } from 'expo/config';

// O preview por PR (Fase P) só abre no Expo Go com a política sdkVersion.
function carregarConfig(expoGoPreview?: string): ExpoConfig {
  const anterior = process.env.EXPO_GO_PREVIEW;
  if (expoGoPreview === undefined) delete process.env.EXPO_GO_PREVIEW;
  else process.env.EXPO_GO_PREVIEW = expoGoPreview;
  let config!: ExpoConfig;
  jest.isolateModules(() => {
    config = require('../app.config').default;
  });
  if (anterior === undefined) delete process.env.EXPO_GO_PREVIEW;
  else process.env.EXPO_GO_PREVIEW = anterior;
  return config;
}

describe('app.config', () => {
  it('usa fingerprint por padrão (builds e updates reais)', () => {
    expect(carregarConfig().runtimeVersion).toEqual({ policy: 'fingerprint' });
  });

  it('usa sdkVersion no preview para o Expo Go', () => {
    expect(carregarConfig('true').runtimeVersion).toEqual({ policy: 'sdkVersion' });
  });

  it('aponta o EAS Update para o projeto do EAS', () => {
    const config = carregarConfig();
    const projectId = config.extra?.eas?.projectId;
    expect(projectId).toMatch(/^[0-9a-f-]{36}$/);
    expect(config.updates?.url).toBe(`https://u.expo.dev/${projectId}`);
  });
});
