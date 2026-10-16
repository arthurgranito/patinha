import { MSG_NOME_INVALIDO } from '../mensagens';
import { timezoneOptions } from '../timezone';
import { normalizeName, validateDisplayName } from '../validacao';

describe('validateDisplayName (F02-1e, F05)', () => {
  it.each(['', '   ', 'a'.repeat(41)])('recusa %j', (name) => {
    expect(validateDisplayName(name)).toBe(MSG_NOME_INVALIDO);
  });
  it.each(['A', 'Ana Souza', 'a'.repeat(40), '  Ana  '])('aceita %j', (name) => {
    expect(validateDisplayName(name)).toBeNull();
  });
  it('conta emoji como 1 caractere', () => {
    expect(validateDisplayName('🐶'.repeat(40))).toBeNull();
  });
  it('normaliza tirando espaços das pontas', () => {
    expect(normalizeName('  Ana  ')).toBe('Ana');
  });
  it('troca controle e direção de texto por espaço (o banco recusa)', () => {
    expect(normalizeName('Ana\nSouza')).toBe('Ana Souza');
    expect(normalizeName('Dani\u202Eela')).toBe('Dani ela');
    expect(validateDisplayName('\u202E\t')).toBe(MSG_NOME_INVALIDO);
  });
});

describe('timezoneOptions', () => {
  it('inclui o fuso do aparelho quando não é do Brasil', () => {
    const ids = timezoneOptions('America/Sao_Paulo', 'Europe/Lisbon').map((o) => o.id);
    expect(ids[0]).toBe('Europe/Lisbon');
    expect(ids).toContain('America/Manaus');
  });
  it('não repete fusos', () => {
    const ids = timezoneOptions('America/Sao_Paulo', 'America/Sao_Paulo').map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
