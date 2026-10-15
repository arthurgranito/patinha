import { getCalendars } from 'expo-localization';

export const FUSO_PADRAO = 'America/Sao_Paulo';

/** Fuso do aparelho (F02-1), com o padrão do banco como reserva. */
export function detectTimezone(): string {
  try {
    return getCalendars()[0]?.timeZone || FUSO_PADRAO;
  } catch {
    return FUSO_PADRAO;
  }
}

/** Fusos do Brasil oferecidos no Perfil (F05). O banco valida qualquer fuso IANA. */
export const FUSOS_BRASIL: { id: string; label: string }[] = [
  { id: 'America/Sao_Paulo', label: 'Horário de Brasília' },
  { id: 'America/Manaus', label: 'Horário do Amazonas (AM, RO, RR, MT, MS)' },
  { id: 'America/Rio_Branco', label: 'Horário do Acre' },
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
];

/** Opções da tela: o fuso atual e o do aparelho entram mesmo se não forem do Brasil. */
export function timezoneOptions(current: string, device: string): { id: string; label: string }[] {
  const options = [...FUSOS_BRASIL];
  for (const id of [device, current]) {
    if (!options.some((o) => o.id === id)) options.unshift({ id, label: id.replace(/_/g, ' ') });
  }
  return options;
}
