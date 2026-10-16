import { Redirect, useRouter } from 'expo-router';

import { CadastroCao } from '@/features/dogs/CadastroCao';
import { useDogs } from '@/features/dogs/DogsProvider';
import { cadastrarCao } from '@/features/dogs/salvar';
import { useProfile } from '@/features/profile/ProfileProvider';

// F08 (cadastrar o cão) e F10 (adicionar outro). Quem não tem cão ativo vem para cá (F03, F12).
export default function CadastroCaoScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { dogs, limit, reload } = useDogs();
  if (!profile?.is_adult_confirmed) return <Redirect href="/onboarding" />;

  const temAtivo = Boolean(profile.active_dog_id);
  const podeReativar = !temAtivo && dogs.some((d) => d.archived_at && !d.passed_away_at);

  return (
    <CadastroCao
      limit={limit}
      onSubmit={async (draft) => {
        const r = await cadastrarCao(profile.id, draft);
        await reload();
        return r;
      }}
      onDone={() => router.replace('/')}
      onCancel={temAtivo ? () => router.back() : undefined}
      onReactivate={podeReativar ? () => router.push('/caes') : undefined}
    />
  );
}
