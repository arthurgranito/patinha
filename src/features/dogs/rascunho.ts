import type { DogWithGoals, DogFields } from './api';
import type { AgeGroup, DailyMinutes, Energy, GoalCode, Intensity, Size } from './opcoes';
import { ageFromBirthMonth, birthMonthFromAge, triagePending, validateDogName } from './validacao';

/** Estado do formulário do cão (cadastro F08 e edição F09). */
export type DogDraft = {
  name: string;
  /** Foto nova escolhida neste formulário (JPEG local já comprimido). */
  photoUri: string | null;
  /** Edição: tirar a foto atual. */
  removePhoto: boolean;
  ageGroup: AgeGroup | null;
  ageAmount: number;
  /** Edição: só regrava birth_month se a idade for mexida. */
  ageTouched: boolean;
  size: Size | null;
  breed: string | null;
  isSrd: boolean;
  energy: Energy | null;
  goals: GoalCode[];
  severity: Partial<Record<GoalCode, Intensity>>;
  dailyMinutes: DailyMinutes | null;
};

export const EMPTY_DRAFT: DogDraft = {
  name: '',
  photoUri: null,
  removePhoto: false,
  ageGroup: null,
  ageAmount: 0,
  ageTouched: false,
  size: null,
  breed: null,
  isSrd: false,
  energy: null,
  goals: [],
  severity: {},
  dailyMinutes: null,
};

export function draftFromDog(dog: DogWithGoals, today = new Date()): DogDraft {
  const age = ageFromBirthMonth(dog.birth_month, today);
  const severity: DogDraft['severity'] = {};
  for (const g of dog.dog_goals) {
    if (g.goal_code === 'mordida' || g.goal_code === 'sozinho') {
      severity[g.goal_code] = g.flagged_severe ? 'grave' : 'leve';
    }
  }
  return {
    ...EMPTY_DRAFT,
    name: dog.name,
    ageGroup: age.group,
    ageAmount: age.amount,
    size: dog.size as Size,
    breed: dog.breed,
    isSrd: dog.is_srd,
    energy: dog.energy as Energy,
    goals: dog.dog_goals.map((g) => g.goal_code as GoalCode),
    severity,
    dailyMinutes: dog.daily_minutes as DailyMinutes,
  };
}

export type Campo =
  'nome' | 'foto' | 'idade' | 'porte' | 'raca' | 'energia' | 'objetivos' | 'tempo';

/** O campo está respondido? (o nome tem mensagem própria, F08-1e) */
export function campoCompleto(campo: Campo, d: DogDraft): boolean {
  switch (campo) {
    case 'nome':
      return validateDogName(d.name) === null;
    case 'foto':
      return true;
    case 'idade':
      return d.ageGroup !== null;
    case 'porte':
      return d.size !== null;
    case 'raca':
      return d.isSrd || Boolean(d.breed);
    case 'energia':
      return d.energy !== null;
    case 'objetivos':
      return d.goals.length > 0 && triagePending(d.goals, d.severity).length === 0;
    case 'tempo':
      return d.dailyMinutes !== null;
  }
}

/** Campos do banco a partir de um rascunho completo. */
export function dogFieldsOf(d: DogDraft, today = new Date()): DogFields {
  return {
    name: d.name,
    birth_month: birthMonthFromAge(d.ageGroup!, d.ageAmount, today),
    size: d.size!,
    breed: d.isSrd ? null : d.breed,
    is_srd: d.isSrd,
    energy: d.energy!,
    daily_minutes: d.dailyMinutes!,
  };
}
