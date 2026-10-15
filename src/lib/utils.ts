/** Junta partes de texto ignorando vazias, nulas ou falsas. */
export function joinText(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
