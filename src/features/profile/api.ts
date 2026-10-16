import { getSupabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

import { normalizeName } from './validacao';

export type Profile = Tables<'profiles'>;

/** Colunas que o app pode alterar (grant por coluna na migration de profiles). */
export type ProfilePreferences = Pick<
  Profile,
  'display_name' | 'timezone' | 'day_cutoff_hour' | 'reminder_hour'
>;

/** Lê o perfil; se faltar (usuário válido sem linha em profiles), cria com ensure_profile(). */
export async function fetchProfile(userId: string): Promise<Profile> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const created = await supabase.rpc('ensure_profile');
  if (created.error) throw created.error;
  return created.data;
}

export async function updatePreferences(
  userId: string,
  prefs: Partial<ProfilePreferences>,
): Promise<Profile> {
  const patch =
    prefs.display_name === undefined
      ? prefs
      : { ...prefs, display_name: normalizeName(prefs.display_name) };
  const { data, error } = await getSupabase()
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** F02-2: nome e fuso + confirm_adult(). */
export async function completeOnboarding(
  userId: string,
  values: { displayName: string; timezone: string },
): Promise<Profile> {
  await updatePreferences(userId, { display_name: values.displayName, timezone: values.timezone });
  const { error } = await getSupabase().rpc('confirm_adult');
  if (error) throw error;
  // TODO(fase 13): evento onboarding_completed.
  return fetchProfile(userId);
}
