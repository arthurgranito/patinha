import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import { MSG_SESSAO_EXPIRADA } from './mensagens';
import { isStoredSessionRejected, signOutLocal } from './session';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  /** Aviso para a tela de entrada (ex.: sessão expirada, X.2). */
  notice: string | null;
  clearNotice: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [notice, setNotice] = useState<string | null>(null);
  const signingOut = useRef(false);
  const hadSession = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      let restored = data.session;
      // X.2: a sessão salva pode ser de um usuário apagado ou com token recusado. O PostgREST
      // ainda aceitaria o JWT até expirar, e o app ficaria preso sem perfil.
      if (restored && (await isStoredSessionRejected())) {
        signingOut.current = true;
        await signOutLocal();
        restored = null;
        if (active) setNotice(MSG_SESSAO_EXPIRADA);
      }
      if (!active) return;
      hadSession.current = Boolean(restored);
      setSession(restored);
    })()
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      // X.2: o supabase-js desloga sozinho quando a renovação do token falha.
      if (event === 'SIGNED_OUT' && hadSession.current && !signingOut.current) {
        setNotice(MSG_SESSAO_EXPIRADA);
      }
      if (event === 'SIGNED_IN') setNotice(null);
      signingOut.current = false;
      hadSession.current = Boolean(next);
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    // F04: "neste aparelho". O escopo padrão (global) encerraria as sessões em todos os aparelhos.
    // TODO(fase 8): apagar o token deste aparelho em push_tokens antes de sair.
    // TODO(fase 10): avisar sobre itens na fila offline e limpar os caches de dados pessoais.
    try {
      await signOutLocal();
    } catch {
      signingOut.current = false;
    }
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({ session, loading, notice, clearNotice, signOut }),
    [session, loading, notice, clearNotice, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
