import { normalizeName } from '@/features/profile/validacao';

import { MSG_NOME_CAO_INVALIDO } from './mensagens';
import { AGE_GROUPS, TRIAGE, type AgeGroup, type GoalCode, type Intensity } from './opcoes';
import { RACAS } from './racas';

export const NOME_CAO_MAX = 30;

/** Nome do cão como vai para o banco (mesma limpeza do nome do tutor). */
export const normalizeDogName = normalizeName;

/** F08-1e: 1 a 30 caracteres (o banco tem a mesma regra em dogs_name_tamanho). */
export function validateDogName(name: string): string | null {
  const length = [...normalizeDogName(name)].length;
  return length >= 1 && length <= NOME_CAO_MAX ? null : MSG_NOME_CAO_INVALIDO;
}

export function ageGroupInfo(group: AgeGroup) {
  return AGE_GROUPS.find((g) => g.value === group)!;
}

/** Idade inicial do seletor ao escolher o grupo. */
export function defaultAgeAmount(group: AgeGroup): number {
  return { filhote: 3, jovem: 12, adulto: 4, idoso: 10 }[group];
}

function monthsOf(group: AgeGroup, amount: number): number {
  return ageGroupInfo(group).unit === 'anos' ? amount * 12 : amount;
}

/** Mês aproximado de nascimento (dia 1, como exige dogs_birth_month_dia_1), em AAAA-MM-01. */
export function birthMonthFromAge(group: AgeGroup, amount: number, today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth() - monthsOf(group, amount), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Caminho inverso, para a edição (F09): grupo e idade a partir do mês de nascimento. */
export function ageFromBirthMonth(
  birthMonth: string,
  today = new Date(),
): { group: AgeGroup; amount: number } {
  const [y = 0, m = 1] = birthMonth.split('-').map(Number);
  const months = Math.max(0, (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m));
  if (months < 6) return { group: 'filhote', amount: months };
  if (months <= 18) return { group: 'jovem', amount: months };
  const years = Math.floor(months / 12);
  if (years < 8) return { group: 'adulto', amount: Math.max(2, years) };
  return { group: 'idoso', amount: Math.min(25, years) };
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "março de 2026" a partir de AAAA-MM-01. */
export function formatBirthMonth(birthMonth: string): string {
  const [y = 0, m = 1] = birthMonth.split('-').map(Number);
  return `${MESES[m - 1] ?? ''} de ${y}`;
}

export function formatAge(group: AgeGroup, amount: number): string {
  const { unit } = ageGroupInfo(group);
  if (unit === 'anos') return amount === 1 ? '1 ano' : `${amount} anos`;
  if (amount === 0) return 'menos de 1 mês';
  return amount === 1 ? '1 mês' : `${amount} meses`;
}

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** F08-5: busca na lista local, sem diferenciar acentos e maiúsculas. */
export function filterBreeds(query: string): string[] {
  const q = semAcento(query.trim());
  if (!q) return [...RACAS];
  return RACAS.filter((r) => semAcento(r).includes(q));
}

/** F08-7a: todo objetivo da triagem marcado precisa ter a intensidade respondida. */
export function triagePending(goals: GoalCode[], severity: Partial<Record<GoalCode, Intensity>>) {
  return goals.filter((g) => TRIAGE[g] && !severity[g]);
}

/** Objetivos como vão para create_dog/save_dog_goals. Grave → flagged_severe (fora do plano). */
export function goalsPayload(
  goals: GoalCode[],
  severity: Partial<Record<GoalCode, Intensity>>,
): { goal_code: GoalCode; flagged_severe: boolean }[] {
  return goals.map((g) => ({
    goal_code: g,
    flagged_severe: Boolean(TRIAGE[g]) && severity[g] === 'grave',
  }));
}
