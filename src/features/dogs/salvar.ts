import {
  createDog,
  removeDogPhoto,
  saveDogGoals,
  updateDog,
  uploadDogPhoto,
  type DogFields,
  type DogWithGoals,
} from './api';
import { dogFieldsOf, type DogDraft } from './rascunho';
import { goalsPayload } from './validacao';

/** F08-9 + F08-2: cria o cão e, se houver, envia a foto. Foto que falha não desfaz o cadastro (2e). */
export async function cadastrarCao(
  ownerId: string,
  draft: DogDraft,
): Promise<{ name: string; photoFailed: boolean }> {
  const dog = await createDog(dogFieldsOf(draft), goalsPayload(draft.goals, draft.severity));
  let photoFailed = false;
  if (draft.photoUri) {
    try {
      await uploadDogPhoto(ownerId, dog.id, draft.photoUri);
    } catch {
      photoFailed = true;
    }
  }
  return { name: dog.name, photoFailed };
}

/** F09: grava só o que mudou. */
export async function salvarEdicao(
  ownerId: string,
  dog: DogWithGoals,
  draft: DogDraft,
): Promise<{ photoFailed: boolean; planChanged: boolean }> {
  const all = dogFieldsOf(draft);
  const patch: Partial<DogFields> = {};
  if (all.name !== dog.name) patch.name = all.name;
  if (draft.ageTouched && all.birth_month !== dog.birth_month) patch.birth_month = all.birth_month;
  if (all.size !== dog.size) patch.size = all.size;
  if (all.is_srd !== dog.is_srd || all.breed !== dog.breed) {
    patch.is_srd = all.is_srd;
    patch.breed = all.breed;
  }
  if (all.energy !== dog.energy) patch.energy = all.energy;
  if (all.daily_minutes !== dog.daily_minutes) patch.daily_minutes = all.daily_minutes;
  if (Object.keys(patch).length > 0) await updateDog(dog.id, patch);

  const goals = goalsPayload(draft.goals, draft.severity);
  const chave = (l: { goal_code: string; flagged_severe: boolean }[]) =>
    l
      .map((g) => `${g.goal_code}:${g.flagged_severe}`)
      .sort()
      .join(',');
  const goalsChanged = chave(goals) !== chave(dog.dog_goals);
  if (goalsChanged) await saveDogGoals(dog.id, goals);

  let photoFailed = false;
  try {
    if (draft.photoUri) await uploadDogPhoto(ownerId, dog.id, draft.photoUri);
    else if (draft.removePhoto) await removeDogPhoto(dog);
  } catch {
    photoFailed = true;
  }
  // TODO(fase 5): com planChanged, perguntar "Quer atualizar o plano do Caramelo?" (F09).
  return { photoFailed, planChanged: goalsChanged || patch.daily_minutes !== undefined };
}
