import { isDevLoginEnabled } from '../devLogin';

const { readdirSync, readFileSync } = jest.requireActual<{
  readdirSync: (path: string) => string[];
  readFileSync: (path: string, encoding: 'utf8') => string;
}>('fs');

// O Jest roda na raiz do repositório (rootDir).
const join = (...parts: string[]) => parts.join('/');
const root = '.';
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('login de teste (Maestro)', () => {
  it('só liga com __DEV__ e EXPO_PUBLIC_DEV_LOGIN=true', () => {
    expect(isDevLoginEnabled(true, 'true')).toBe(true);
    expect(isDevLoginEnabled(true, undefined)).toBe(false);
    expect(isDevLoginEnabled(true, '1')).toBe(false);
    // Builds e EAS Updates de preview e produção: __DEV__ = false.
    expect(isDevLoginEnabled(false, 'true')).toBe(false);
  });

  it('nenhum perfil do EAS (preview, production…) define EXPO_PUBLIC_DEV_LOGIN', () => {
    expect(read('eas.json')).not.toMatch(/EXPO_PUBLIC_DEV_LOGIN/);
  });

  it('nenhum workflow do CI define EXPO_PUBLIC_DEV_LOGIN', () => {
    const dir = '.github/workflows';
    for (const file of readdirSync(join(root, dir))) {
      expect(read(`${dir}/${file}`)).not.toMatch(/EXPO_PUBLIC_DEV_LOGIN/);
    }
  });

  it('o .env.example deixa o login de teste desligado', () => {
    expect(read('.env.example')).not.toMatch(/^EXPO_PUBLIC_DEV_LOGIN\s*=\s*true/m);
  });

  it('o usuário de teste fica fora do seed que o db-dev leva para a nuvem', () => {
    const seedPaths = read('supabase/config.toml').match(/^sql_paths\s*=\s*(.*)$/m)?.[1] ?? '';
    expect(seedPaths).not.toMatch(/dev/);
    expect(read('supabase/seed.sql')).not.toMatch(/teste@patinha\.local/);
  });
});
