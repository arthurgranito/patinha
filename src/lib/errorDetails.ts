// "Detalhes" na tela de erro (X.3) até o Sentry entrar (Fase 13): só em desenvolvimento e nos
// builds/updates de preview, que definem EXPO_PUBLIC_ERROR_DETAILS=true (preview.yml e o perfil
// "preview" do eas.json). Produção não define a variável.
export function showErrorDetails(
  isDev: boolean = __DEV__,
  flag: string | undefined = process.env.EXPO_PUBLIC_ERROR_DETAILS,
): boolean {
  return isDev === true || flag === 'true';
}

/** Código e mensagem técnica de erros do supabase-js (Auth, PostgREST) ou de JS. */
export function describeError(error: unknown): { code: string; message: string } {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const code = [e.code, e.error_code, e.status, e.name].find(
      (v) => (typeof v === 'string' && v !== '') || typeof v === 'number',
    );
    const parts = [e.message, e.details, e.hint].filter(
      (v): v is string => typeof v === 'string' && v !== '',
    );
    return {
      code: code === undefined ? 'desconhecido' : String(code),
      message: parts.length ? parts.join(' — ') : String(error),
    };
  }
  return { code: 'desconhecido', message: String(error) };
}
