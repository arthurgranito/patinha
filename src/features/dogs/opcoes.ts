// Opções do cadastro do cão (F08). Os códigos são os dos checks do banco.

export type Size = 'mini' | 'pequeno' | 'medio' | 'grande' | 'gigante';
export type Energy = 'baixa' | 'media' | 'alta';
export type GoalCode =
  'xixi' | 'guia' | 'latido' | 'mordida' | 'pular' | 'chamado' | 'sozinho' | 'truques' | 'filhote';
export type DailyMinutes = 5 | 10 | 15;
export type AgeGroup = 'filhote' | 'jovem' | 'adulto' | 'idoso';
export type Intensity = 'leve' | 'grave';

/** Faixa de idade de cada grupo: meses (filhote, jovem) ou anos (adulto, idoso). */
export const AGE_GROUPS: {
  value: AgeGroup;
  label: string;
  hint: string;
  unit: 'meses' | 'anos';
  min: number;
  max: number;
}[] = [
  { value: 'filhote', label: 'Filhote', hint: 'até 6 meses', unit: 'meses', min: 0, max: 5 },
  { value: 'jovem', label: 'Jovem', hint: '6 a 18 meses', unit: 'meses', min: 6, max: 18 },
  { value: 'adulto', label: 'Adulto', hint: '2 a 7 anos', unit: 'anos', min: 2, max: 7 },
  { value: 'idoso', label: 'Idoso', hint: '8 anos ou mais', unit: 'anos', min: 8, max: 25 },
];

// "Ilustração" do porte: o mesmo cão em tamanhos crescentes.
export const SIZES: { value: Size; label: string; scale: number }[] = [
  { value: 'mini', label: 'Mini', scale: 20 },
  { value: 'pequeno', label: 'Pequeno', scale: 28 },
  { value: 'medio', label: 'Médio', scale: 36 },
  { value: 'grande', label: 'Grande', scale: 44 },
  { value: 'gigante', label: 'Gigante', scale: 52 },
];

export const ENERGIES: { value: Energy; label: string; icon: string }[] = [
  { value: 'baixa', label: 'Calmo', icon: '😴' },
  { value: 'media', label: 'No meio-termo', icon: '🙂' },
  { value: 'alta', label: 'Furacão', icon: '🌪️' },
];

export const GOALS: { value: GoalCode; label: string; icon: string }[] = [
  { value: 'xixi', label: 'Xixi no lugar errado', icon: '💧' },
  { value: 'guia', label: 'Puxa a guia', icon: '🦮' },
  { value: 'latido', label: 'Late demais', icon: '🔊' },
  { value: 'mordida', label: 'Morde tudo', icon: '🦷' },
  { value: 'pular', label: 'Pula nas pessoas', icon: '🦘' },
  { value: 'chamado', label: 'Não vem quando chamo', icon: '📣' },
  { value: 'sozinho', label: 'Fica ansioso sozinho', icon: '🏠' },
  { value: 'truques', label: 'Quero ensinar truques', icon: '🎩' },
  { value: 'filhote', label: 'É filhote e quero começar certo', icon: '🐶' },
];

/** F08-7a: objetivos que pedem a intensidade (ADR-07). */
export const TRIAGE: Partial<Record<GoalCode, { leve: string; grave: string }>> = {
  mordida: { leve: 'Morde de brincadeira', grave: 'Já mordeu alguém e machucou' },
  sozinho: { leve: 'Chora um pouco', grave: 'Se machuca ou destrói portas quando sozinho' },
};

export const DAILY_MINUTES: DailyMinutes[] = [5, 10, 15];
