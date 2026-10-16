import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useProfile } from '@/features/profile/ProfileProvider';

import { fetchDogs, fetchIsPremium, signPhotoUrls, type DogLimit, type DogWithGoals } from './api';

type DogsContextValue = {
  dogs: DogWithGoals[];
  /** URL assinada da foto, por id do cão. */
  photoUrls: Record<string, string>;
  activeDog: DogWithGoals | null;
  /** Limite do plano já atingido (F10): o "+" mostra o aviso em vez do cadastro. */
  limit: DogLimit | null;
  loading: boolean;
  error: unknown;
  /** Relê os cães e o perfil (o banco mantém active_dog_id). */
  reload: () => Promise<void>;
};

const DogsContext = createContext<DogsContextValue | null>(null);

export const LIMITE_GRATIS = 1;
export const LIMITE_PREMIUM = 5;

export function dogLimitFor(dogs: DogWithGoals[], isPremium: boolean): DogLimit | null {
  const ativos = dogs.filter((d) => !d.archived_at).length;
  if (isPremium) return ativos >= LIMITE_PREMIUM ? 'premium' : null;
  return ativos >= LIMITE_GRATIS ? 'gratis' : null;
}

export function DogsProvider({ children }: { children: ReactNode }) {
  const { profile, refresh } = useProfile();
  const userId = profile?.id;
  const [dogs, setDogs] = useState<DogWithGoals[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) return null;
    const [list, premium] = await Promise.all([fetchDogs(), fetchIsPremium(userId)]);
    // Foto que não carrega não impede o resto: o avatar com a inicial aparece no lugar.
    const urls = await signPhotoUrls(list).catch(() => ({}));
    return { list, premium, urls };
  }, [userId]);

  const apply = useCallback((r: Awaited<ReturnType<typeof fetchAll>>) => {
    if (!r) return;
    setDogs(r.list);
    setIsPremium(r.premium);
    setPhotoUrls(r.urls);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    fetchAll()
      .then((r) => active && apply(r))
      .catch((e: unknown) => active && setError(e ?? new Error('erro desconhecido')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [fetchAll, apply]);

  const reload = useCallback(async () => {
    try {
      const [r] = await Promise.all([fetchAll(), refresh().catch(() => {})]);
      apply(r);
    } catch (e) {
      setError(e ?? new Error('erro desconhecido'));
    }
  }, [fetchAll, apply, refresh]);

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === profile?.active_dog_id && !d.archived_at) ?? null,
    [dogs, profile?.active_dog_id],
  );
  const value = useMemo(
    () => ({
      dogs,
      photoUrls,
      activeDog,
      limit: dogLimitFor(dogs, isPremium),
      loading,
      error,
      reload,
    }),
    [dogs, photoUrls, activeDog, isPremium, loading, error, reload],
  );
  return <DogsContext.Provider value={value}>{children}</DogsContext.Provider>;
}

export function useDogs(): DogsContextValue {
  const ctx = useContext(DogsContext);
  if (!ctx) throw new Error('useDogs precisa estar dentro de <DogsProvider>.');
  return ctx;
}
