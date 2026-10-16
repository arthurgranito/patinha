-- Fase 1 (bug do preview): usuário válido sem linha em profiles não pode travar o app.
-- ensure_profile() cria o perfil do próprio auth.uid() se faltar (idempotente) e devolve a linha.
-- O nome padrão sai de uma função só, usada também pelo trigger handle_new_user.

create function public.default_display_name(p_meta jsonb, p_email text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_controle constant text := '[\x01-\x1f\x7f-\x9f‎‏‪-‮⁦-⁩]';
  v_name text;
begin
  v_name := coalesce(
    nullif(btrim(regexp_replace(p_meta ->> 'full_name', v_controle, ' ', 'g')), ''),
    nullif(btrim(regexp_replace(p_meta ->> 'name', v_controle, ' ', 'g')), ''),
    nullif(btrim(regexp_replace(split_part(coalesce(p_email, ''), '@', 1), v_controle, ' ', 'g')), '')
  );
  return coalesce(nullif(btrim(left(v_name, 40)), ''), 'Tutor');
end;
$$;

revoke execute on function public.default_display_name(jsonb, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, public.default_display_name(new.raw_user_meta_data, new.email));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create function public.ensure_profile()
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  -- Só cria para quem ainda existe no Auth (usuário apagado não ganha perfil novo).
  insert into public.profiles (id, display_name)
  select u.id, public.default_display_name(u.raw_user_meta_data, u.email)
    from auth.users u
   where u.id = v_uid
  on conflict (id) do nothing;

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'usuário não encontrado' using errcode = 'P0002';
  end if;
  return v_profile;
end;
$$;

revoke execute on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;
