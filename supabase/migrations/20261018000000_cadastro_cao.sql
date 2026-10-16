-- Fase 3 — Cadastro do cão (F08 a F12).
--   * Bucket privado dog-photos: cada tutor só lê e escreve a própria pasta <uid>/, e a foto
--     só pode ter o nome <dog_id>.jpg de um cão dele.
--   * dogs.photo_path fixo em <owner_id>/<id>.jpg; vira-lata não tem raça.
--   * "O cão partiu 🌈" (lacuna do F12): passed_away_at, só com o cão arquivado e sem volta.
--   * Cão ativo mantido pelo banco: o 1º cão vira o ativo; arquivar ou apagar o ativo passa
--     o posto para o cão ativo mais antigo (ou deixa nulo, e o app manda para o F08).
--   * F11: o app troca profiles.active_dog_id (grant de coluna).
--   * RPCs create_dog (cão + objetivos numa transação só) e save_dog_goals (F09). Ambas
--     security invoker: RLS, grants e triggers valem como em qualquer escrita do app.

-- =====================================================================================
-- dogs: colunas e regras novas
-- =====================================================================================

alter table public.dogs
  add column passed_away_at timestamptz,
  add constraint dogs_partiu_arquivado check (passed_away_at is null or archived_at is not null),
  add constraint dogs_srd_sem_raca check (not is_srd or breed is null),
  add constraint dogs_birth_month_faixa check (birth_month >= date '1990-01-01'),
  drop constraint dogs_photo_path_do_dono,
  add constraint dogs_photo_path_do_dono check (
    photo_path is null or photo_path = owner_id::text || '/' || id::text || '.jpg'
  );

comment on column public.dogs.passed_away_at is
  'O cão partiu 🌈 (F12): arquivado para sempre; nunca mais lembrete nem card dele.';

-- Regras que dependem de now() ou do valor anterior (não cabem em check).
-- O nome começa antes de dogs_enforce_limit para rodar primeiro (triggers em ordem alfabética).
create function public.dogs_check_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_month > date_trunc('month', now())::date then
    raise exception 'Escolha um mês que já passou.' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    new.passed_away_at := null;
    return new;
  end if;

  if old.passed_away_at is not null then
    if new.passed_away_at is distinct from old.passed_away_at or new.archived_at is null then
      raise exception '% está guardado com carinho e não pode ser reativado.', old.name
        using errcode = 'PA005', hint = 'cao_partiu';
    end if;
  elsif new.passed_away_at is not null then
    -- Marcar que partiu: a hora é a do banco, e o cão é arquivado junto.
    new.passed_away_at := now();
    new.archived_at := coalesce(new.archived_at, now());
  end if;
  return new;
end;
$$;

revoke execute on function public.dogs_check_rules() from public, anon, authenticated;

create trigger dogs_check_rules
  before insert or update on public.dogs
  for each row execute function public.dogs_check_rules();

grant update (passed_away_at) on public.dogs to authenticated;

-- =====================================================================================
-- Cão ativo (F08 passo 9, F11, F12)
-- =====================================================================================

-- Põe no lugar de p_gone (ou de um ativo nulo) o cão ativo mais antigo do tutor.
create function public.reassign_active_dog(p_owner uuid, p_gone uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles p
     set active_dog_id = (
       select d.id from public.dogs d
        where d.owner_id = p_owner and d.archived_at is null and d.id is distinct from p_gone
        order by d.created_at, d.id
        limit 1
     )
   where p.id = p_owner
     and (p.active_dog_id is null or p.active_dog_id = p_gone);
$$;

revoke execute on function public.reassign_active_dog(uuid, uuid) from public, anon, authenticated;

create function public.dogs_keep_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.reassign_active_dog(old.owner_id, old.id);
    return old;
  end if;

  -- Sem "update of archived_at" no trigger: o "partiu" arquiva pelo BEFORE, e um trigger com
  -- lista de colunas só olha o SET do comando.
  if tg_op = 'UPDATE' and (old.archived_at is null) = (new.archived_at is null) then
    return new;
  end if;

  if new.archived_at is null then
    -- Cão novo ou reativado: vira o ativo só se o tutor não tiver nenhum.
    update public.profiles set active_dog_id = new.id
     where id = new.owner_id and active_dog_id is null;
  else
    perform public.reassign_active_dog(new.owner_id, new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.dogs_keep_active() from public, anon, authenticated;

create trigger dogs_keep_active
  after insert or update or delete on public.dogs
  for each row execute function public.dogs_keep_active();

-- F11: o tutor escolhe o cão ativo (profiles_validate_active_dog garante que é dele e ativo).
grant update (active_dog_id) on public.profiles to authenticated;

-- =====================================================================================
-- RPCs do cadastro e da edição
-- =====================================================================================

-- F09: troca os objetivos do cão pela lista dada ([{goal_code, flagged_severe}]).
create function public.save_dog_goals(p_dog_id uuid, p_goals jsonb)
returns setof public.dog_goals
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(p_goals) is distinct from 'array' then
    raise exception 'objetivos inválidos' using errcode = '22023';
  end if;
  if not public.owns_dog(p_dog_id) then
    raise exception 'Isso não é seu.' using errcode = '42501';
  end if;

  delete from public.dog_goals g
   where g.dog_id = p_dog_id
     and g.goal_code not in (select e ->> 'goal_code' from jsonb_array_elements(p_goals) e);

  insert into public.dog_goals (dog_id, goal_code, flagged_severe)
  select distinct on (e ->> 'goal_code')
         p_dog_id, e ->> 'goal_code', coalesce((e ->> 'flagged_severe')::boolean, false)
    from jsonb_array_elements(p_goals) e
  on conflict (dog_id, goal_code) do update set flagged_severe = excluded.flagged_severe;

  return query select * from public.dog_goals g where g.dog_id = p_dog_id;
end;
$$;

revoke execute on function public.save_dog_goals(uuid, jsonb) from public, anon;
grant execute on function public.save_dog_goals(uuid, jsonb) to authenticated;

-- F08 passo 9: cão + objetivos de uma vez (o limite de cães e o cão ativo vêm dos triggers).
create function public.create_dog(
  p_name text,
  p_birth_month date,
  p_size text,
  p_breed text,
  p_is_srd boolean,
  p_energy text,
  p_daily_minutes int,
  p_goals jsonb
)
returns public.dogs
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dog public.dogs;
begin
  insert into public.dogs (name, birth_month, size, breed, is_srd, energy, daily_minutes)
  values (p_name, p_birth_month, p_size, p_breed, coalesce(p_is_srd, false), p_energy, p_daily_minutes)
  returning * into v_dog;

  perform public.save_dog_goals(v_dog.id, coalesce(p_goals, '[]'::jsonb));
  -- TODO(fase 5): build_plan (F13). TODO(fase 13): evento dog_created.
  return v_dog;
end;
$$;

revoke execute on function public.create_dog(text, date, text, text, boolean, text, int, jsonb) from public, anon;
grant execute on function public.create_dog(text, date, text, text, boolean, text, int, jsonb) to authenticated;

-- =====================================================================================
-- Storage: bucket privado dog-photos (F08 passo 2)
-- =====================================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dog-photos', 'dog-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- O objeto <uid>/<dog_id>.jpg pode ser escrito pelo usuário da requisição?
-- Exige a pasta do próprio usuário, o nome exato e um cão dele (ativo ou arquivado).
create function public.can_write_dog_photo(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid constant uuid := (select auth.uid());
  v_partes text[];
begin
  if v_uid is null or p_name is null then
    return false;
  end if;
  v_partes := regexp_match(
    p_name, '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg$'
  );
  if v_partes is null or v_partes[1] <> v_uid::text then
    return false;
  end if;
  return exists (
    select 1 from public.dogs d where d.id = v_partes[2]::uuid and d.owner_id = v_uid
  ) and public.is_adult();
end;
$$;

revoke execute on function public.can_write_dog_photo(text) from public, anon;
grant execute on function public.can_write_dog_photo(text) to authenticated;

create policy "dog-photos: dono lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "dog-photos: dono envia (18+)" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dog-photos' and public.can_write_dog_photo(name));

create policy "dog-photos: dono substitui (18+)" on storage.objects
  for update to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'dog-photos' and public.can_write_dog_photo(name));

-- Apagar só exige a pasta: a foto de um cão já excluído também precisa sair (F12).
create policy "dog-photos: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
