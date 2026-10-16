import { describeError, showErrorDetails } from '../errorDetails';

const { readFileSync } = jest.requireActual<{
  readFileSync: (path: string, encoding: 'utf8') => string;
}>('fs');

describe('showErrorDetails ("Detalhes" na tela de erro)', () => {
  it('aparece em desenvolvimento e nos previews', () => {
    expect(showErrorDetails(true, undefined)).toBe(true);
    expect(showErrorDetails(false, 'true')).toBe(true);
  });

  it('não aparece em produção (sem __DEV__ e sem a variável)', () => {
    expect(showErrorDetails(false, undefined)).toBe(false);
    expect(showErrorDetails(false, 'false')).toBe(false);
  });

  it('o perfil production do eas.json não liga a variável; o preview liga', () => {
    const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
    expect(JSON.stringify(eas.build.production)).not.toMatch(/EXPO_PUBLIC_ERROR_DETAILS/);
    expect(eas.build.preview.env.EXPO_PUBLIC_ERROR_DETAILS).toBe('true');
  });

  it('o workflow de preview liga a variável', () => {
    expect(readFileSync('.github/workflows/preview.yml', 'utf8')).toMatch(
      /EXPO_PUBLIC_ERROR_DETAILS: 'true'/,
    );
  });
});

describe('describeError', () => {
  it('lê código e mensagem de erro do PostgREST', () => {
    expect(
      describeError({
        code: 'PGRST116',
        message: 'JSON object requested',
        details: '0 rows',
        hint: null,
      }),
    ).toEqual({ code: 'PGRST116', message: 'JSON object requested — 0 rows' });
  });
  it('lê error_code de erro do Auth', () => {
    expect(
      describeError({
        error_code: 'user_not_found',
        message: 'User not found',
        name: 'AuthApiError',
      }),
    ).toEqual({ code: 'user_not_found', message: 'User not found' });
  });
  it('cai no name de erro JS', () => {
    expect(describeError(new TypeError('x is undefined'))).toEqual({
      code: 'TypeError',
      message: 'x is undefined',
    });
  });
});
