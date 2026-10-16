import { useRouter } from 'expo-router';

import { ErrorScreen } from '@/components/ui/ErrorScreen';
import {
  archiveDog,
  deleteDog,
  markPassedAway,
  reactivateDog,
  setActiveDog,
} from '@/features/dogs/api';
import { useDogs } from '@/features/dogs/DogsProvider';
import { MeusCaes } from '@/features/dogs/MeusCaes';
import { useProfile } from '@/features/profile/ProfileProvider';

// "Meus cães" (F09–F12). O banco mantém o cão ativo ao arquivar ou excluir.
export default function MeusCaesScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { dogs, photoUrls, limit, error, reload } = useDogs();
  if (!profile) return null;
  if (error && dogs.length === 0)
    return <ErrorScreen error={error} onRetry={() => void reload()} />;

  // Sem nenhum cão ativo depois da ação, a pessoa vai para o F08.
  const depois = (acao: () => Promise<void>) => async () => {
    await acao();
    await reload();
  };

  return (
    <MeusCaes
      dogs={dogs}
      photoUrls={photoUrls}
      activeDogId={profile.active_dog_id}
      limit={limit}
      onAdd={() => router.push('/cadastro-cao')}
      onEdit={(dog) => router.push({ pathname: '/caes/[id]', params: { id: dog.id } })}
      onSetActive={(dog) => depois(() => setActiveDog(profile.id, dog.id))()}
      onArchive={(dog) => depois(() => archiveDog(dog.id))()}
      onPassedAway={(dog) => depois(() => markPassedAway(dog.id))()}
      onDelete={(dog) => depois(() => deleteDog(dog))()}
      onReactivate={(dog) => depois(() => reactivateDog(dog.id))()}
    />
  );
}
