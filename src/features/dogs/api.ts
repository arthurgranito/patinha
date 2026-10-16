import { getSupabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

import { MSG_LIMITE_GRATIS, MSG_LIMITE_PREMIUM } from './mensagens';
import type { DailyMinutes, Energy, GoalCode, Size } from './opcoes';
import { normalizeDogName } from './validacao';

export type Dog = Tables<'dogs'>;
export type DogGoal = Tables<'dog_goals'>;
export type DogWithGoals = Dog & { dog_goals: Pick<DogGoal, 'goal_code' | 'flagged_severe'>[] };
export type GoalInput = { goal_code: GoalCode; flagged_severe: boolean };

export const BUCKET_FOTOS = 'dog-photos';
const URL_ASSINADA_SEGUNDOS = 60 * 60;

export type DogFields = {
  name: string;
  birth_month: string;
  size: Size;
  breed: string | null;
  is_srd: boolean;
  energy: Energy;
  daily_minutes: DailyMinutes;
};

/** Erros do banco com mensagem de tela (dogs_enforce_limit, docs/flows.md F08-9e e F10). */
export type DogLimit = 'gratis' | 'premium';

export function dogLimitOf(error: unknown): DogLimit | null {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'PA001') return 'gratis';
  if (code === 'PA002') return 'premium';
  return null;
}

export function dogLimitMessage(limit: DogLimit): string {
  return limit === 'gratis' ? MSG_LIMITE_GRATIS : MSG_LIMITE_PREMIUM;
}

/** Caminho da foto no bucket privado: <uid>/<dog_id>.jpg (dogs_photo_path_do_dono). */
export function photoPath(ownerId: string, dogId: string): string {
  return `${ownerId}/${dogId}.jpg`;
}

const COLUNAS =
  'id, owner_id, name, photo_path, birth_month, size, breed, is_srd, energy, daily_minutes, archived_at, passed_away_at, created_at, dog_goals (goal_code, flagged_severe)';

/** Todos os cães do tutor (a RLS já restringe ao dono), do mais antigo ao mais novo. */
export async function fetchDogs(): Promise<DogWithGoals[]> {
  const { data, error } = await getSupabase()
    .from('dogs')
    .select(COLUNAS)
    .order('created_at')
    .order('id');
  if (error) throw error;
  return data;
}

export async function fetchIsPremium(userId: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_premium', { p_user_id: userId });
  if (error) throw error;
  return Boolean(data);
}

/** URLs assinadas (1 h) das fotos, por id do cão. */
export async function signPhotoUrls(dogs: Dog[]): Promise<Record<string, string>> {
  const comFoto = dogs.filter((d) => d.photo_path);
  if (comFoto.length === 0) return {};
  const { data, error } = await getSupabase()
    .storage.from(BUCKET_FOTOS)
    .createSignedUrls(
      comFoto.map((d) => d.photo_path!),
      URL_ASSINADA_SEGUNDOS,
    );
  if (error) throw error;
  const urls: Record<string, string> = {};
  data.forEach((item, i) => {
    const dog = comFoto[i];
    if (dog && item.signedUrl) urls[dog.id] = item.signedUrl;
  });
  return urls;
}

/** F08-9: cão e objetivos numa transação; o banco aplica o limite e define o cão ativo. */
export async function createDog(fields: DogFields, goals: GoalInput[]): Promise<Dog> {
  const { data, error } = await getSupabase().rpc('create_dog', {
    p_name: normalizeDogName(fields.name),
    p_birth_month: fields.birth_month,
    p_size: fields.size,
    // Os tipos gerados não marcam parâmetros de função como anuláveis; o banco aceita null.
    p_breed: (fields.is_srd ? null : fields.breed) as string,
    p_is_srd: fields.is_srd,
    p_energy: fields.energy,
    p_daily_minutes: fields.daily_minutes,
    p_goals: goals,
  });
  if (error) throw error;
  return data;
}

/** F09: altera só os campos dados. */
export async function updateDog(dogId: string, patch: Partial<DogFields>): Promise<void> {
  const clean = { ...patch };
  if (clean.name !== undefined) clean.name = normalizeDogName(clean.name);
  if (clean.is_srd) clean.breed = null;
  const { error } = await getSupabase().from('dogs').update(clean).eq('id', dogId);
  if (error) throw error;
}

export async function saveDogGoals(dogId: string, goals: GoalInput[]): Promise<void> {
  const { error } = await getSupabase().rpc('save_dog_goals', { p_dog_id: dogId, p_goals: goals });
  if (error) throw error;
}

/** F08-2: envia o JPEG já comprimido e grava o caminho no cão. */
export async function uploadDogPhoto(ownerId: string, dogId: string, uri: string): Promise<void> {
  const supabase = getSupabase();
  const path = photoPath(ownerId, dogId);
  const body = await (await fetch(uri)).arrayBuffer();
  const upload = await supabase.storage
    .from(BUCKET_FOTOS)
    .upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (upload.error) throw upload.error;
  const { error } = await supabase.from('dogs').update({ photo_path: path }).eq('id', dogId);
  if (error) throw error;
}

export async function removeDogPhoto(dog: Dog): Promise<void> {
  if (!dog.photo_path) return;
  const supabase = getSupabase();
  const removed = await supabase.storage.from(BUCKET_FOTOS).remove([dog.photo_path]);
  if (removed.error) throw removed.error;
  const { error } = await supabase.from('dogs').update({ photo_path: null }).eq('id', dog.id);
  if (error) throw error;
}

/** F11: o banco confere que o cão é do tutor e está ativo. */
export async function setActiveDog(userId: string, dogId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('profiles')
    .update({ active_dog_id: dogId })
    .eq('id', userId);
  if (error) throw error;
}

/** F12-1: arquivar (o banco passa o posto de cão ativo para outro). */
export async function archiveDog(dogId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('dogs')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', dogId);
  if (error) throw error;
}

/** F12 "partiu 🌈": o banco grava a hora e arquiva junto, sem volta. */
export async function markPassedAway(dogId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('dogs')
    .update({ passed_away_at: new Date().toISOString() })
    .eq('id', dogId);
  if (error) throw error;
}

/** F12 reativar: sujeito ao limite do plano (PA001/PA002). */
export async function reactivateDog(dogId: string): Promise<void> {
  const { error } = await getSupabase().from('dogs').update({ archived_at: null }).eq('id', dogId);
  if (error) throw error;
}

/** F12-2: apaga a foto e depois o cão (o histórico vai junto, em cascata). */
export async function deleteDog(dog: Dog): Promise<void> {
  const supabase = getSupabase();
  if (dog.photo_path) {
    const removed = await supabase.storage.from(BUCKET_FOTOS).remove([dog.photo_path]);
    if (removed.error) throw removed.error;
  }
  const { error } = await supabase.from('dogs').delete().eq('id', dog.id);
  if (error) throw error;
}
