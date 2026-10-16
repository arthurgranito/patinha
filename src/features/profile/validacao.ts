import { MSG_NOME_INVALIDO } from './mensagens';

export const NOME_MAX = 40;

// Controle e direção de texto (U+200E/F, U+202A-E, U+2066-9): o banco recusa
// (profiles_display_name_sem_controle), então o app troca por espaço antes de salvar.
const CONTROLE = /[\u0001-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/** Nome como vai para o banco: sem caracteres de controle e sem espaços nas pontas. */
export function normalizeName(name: string): string {
  return name.replace(CONTROLE, ' ').trim();
}

/** F02-1e / F05: 1 a 40 caracteres (o banco tem a mesma regra em profiles_display_name_tamanho). */
export function validateDisplayName(name: string): string | null {
  const length = [...normalizeName(name)].length;
  return length >= 1 && length <= NOME_MAX ? null : MSG_NOME_INVALIDO;
}

export function formatHour(hour: number): string {
  return `${hour}h`;
}
