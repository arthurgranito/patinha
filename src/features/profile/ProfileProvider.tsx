import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchProfile, type Profile } from './api';

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  /** Erro do último carregamento (para "Detalhes" na tela de erro). */
  error: unknown;
  reload: () => void;
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Monte com `key={userId}`: trocar de usuário recomeça o estado do zero. */
export function ProfileProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchProfile(userId)
      .then((p) => active && setProfile(p))
      .catch((e: unknown) => active && setError(e ?? new Error('erro desconhecido')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((n) => n + 1);
  }, []);
  const value = useMemo(
    () => ({ profile, loading, error, reload, setProfile }),
    [profile, loading, error, reload],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile precisa estar dentro de <ProfileProvider>.');
  return ctx;
}
