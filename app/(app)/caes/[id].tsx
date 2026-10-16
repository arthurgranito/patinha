import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useDogs } from '@/features/dogs/DogsProvider';
import { EditarCao } from '@/features/dogs/EditarCao';
import { salvarEdicao } from '@/features/dogs/salvar';
import { useProfile } from '@/features/profile/ProfileProvider';

// F09 — editar o cão. TODO(fase 7): o gatilho passa a ser a Carteirinha → "Editar".
export default function EditarCaoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const { dogs, photoUrls, loading, reload } = useDogs();
  const dog = dogs.find((d) => d.id === id);
  if (!profile) return null;
  if (!dog) return loading ? null : <Redirect href="/caes" />;

  return (
    <EditarCao
      key={dog.id}
      dog={dog}
      photoUrl={photoUrls[dog.id]}
      onSave={async (draft) => {
        const r = await salvarEdicao(profile.id, dog, draft);
        await reload();
        return r;
      }}
      onDone={() => router.back()}
    />
  );
}
