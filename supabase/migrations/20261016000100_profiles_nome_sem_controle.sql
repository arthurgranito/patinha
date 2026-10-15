-- Fase 1 (revisão de segurança): display_name sem caracteres de controle nem de direção de texto
-- (U+200E/F, U+202A-E, U+2066-9), que embaralham o nome nos cards (ADR-09).
-- O trigger handle_new_user passa a remover esses caracteres do nome vindo do provedor,
-- senão o check recusaria o cadastro.

alter table public.profiles
  add constraint profiles_display_name_sem_controle
  check (display_name !~ '[\x01-\x1f\x7f-\x9f‎‏‪-‮⁦-⁩]');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_controle constant text := '[\x01-\x1f\x7f-\x9f‎‏‪-‮⁦-⁩]';
begin
  v_name := coalesce(
    nullif(btrim(regexp_replace(new.raw_user_meta_data ->> 'full_name', v_controle, ' ', 'g')), ''),
    nullif(btrim(regexp_replace(new.raw_user_meta_data ->> 'name', v_controle, ' ', 'g')), ''),
    nullif(btrim(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), v_controle, ' ', 'g')), '')
  );
  v_name := nullif(btrim(left(v_name, 40)), '');

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(v_name, 'Tutor'));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
