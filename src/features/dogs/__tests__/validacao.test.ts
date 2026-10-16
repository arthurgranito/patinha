import { MSG_NOME_CAO_INVALIDO } from '../mensagens';
import {
  ageFromBirthMonth,
  birthMonthFromAge,
  filterBreeds,
  formatBirthMonth,
  goalsPayload,
  triagePending,
  validateDogName,
} from '../validacao';

const HOJE = new Date(2026, 9, 16); // 16/10/2026

describe('validateDogName (F08-1e)', () => {
  it.each(['', '   ', 'a'.repeat(31), '‎'])('recusa %j', (n) => {
    expect(validateDogName(n)).toBe(MSG_NOME_CAO_INVALIDO);
  });
  it.each(['Caramelo', 'a'.repeat(30), '  Mel  '])('aceita %j', (n) => {
    expect(validateDogName(n)).toBeNull();
  });
});

describe('idade e mês de nascimento (F08-3)', () => {
  it('filhote de 3 meses nasceu em julho', () => {
    expect(birthMonthFromAge('filhote', 3, HOJE)).toBe('2026-07-01');
  });
  it('adulto de 4 anos volta 48 meses', () => {
    expect(birthMonthFromAge('adulto', 4, HOJE)).toBe('2022-10-01');
  });
  it('vira o ano certo', () => {
    expect(birthMonthFromAge('jovem', 12, HOJE)).toBe('2025-10-01');
    expect(formatBirthMonth('2025-10-01')).toBe('outubro de 2025');
  });
  it.each([
    ['2026-07-01', { group: 'filhote', amount: 3 }],
    ['2025-10-01', { group: 'jovem', amount: 12 }],
    ['2022-10-01', { group: 'adulto', amount: 4 }],
    ['2015-01-01', { group: 'idoso', amount: 11 }],
  ])('edição: %s vira %j', (birth, esperado) => {
    expect(ageFromBirthMonth(birth, HOJE)).toEqual(esperado);
  });
});

describe('filterBreeds (F08-5)', () => {
  it('busca sem acento e sem maiúsculas', () => {
    expect(filterBreeds('sao')).toContain('São Bernardo');
    expect(filterBreeds('SHIH')).toEqual(['Shih-tzu']);
  });
  it('sem busca devolve a lista inteira', () => {
    expect(filterBreeds('').length).toBeGreaterThan(40);
  });
});

describe('triagem (F08-7a, ADR-07)', () => {
  it('mordida e sozinho exigem a intensidade', () => {
    expect(triagePending(['mordida', 'xixi', 'sozinho'], { sozinho: 'leve' })).toEqual(['mordida']);
  });
  it('grave marca flagged_severe; leve e os outros não', () => {
    expect(
      goalsPayload(['mordida', 'sozinho', 'xixi'], { mordida: 'grave', sozinho: 'leve' }),
    ).toEqual([
      { goal_code: 'mordida', flagged_severe: true },
      { goal_code: 'sozinho', flagged_severe: false },
      { goal_code: 'xixi', flagged_severe: false },
    ]);
  });
});
