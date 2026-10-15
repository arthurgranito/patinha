-- Fase 1 — Login e perfil (F01, F02, F05).
-- profiles: 1 linha por usuário do Auth, criada pelo trigger em auth.users.
-- O app só lê o próprio perfil e só altera as colunas de preferência (grant por coluna);
-- a confirmação de maioridade passa pela função confirm_adult().

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_tamanho
    check (char_length(display_name) between 1 and 40 and btrim(display_name) <> ''),
  timezone text not null default 'America/Sao_Paulo',
  day_cutoff_hour int not null default 4
    constraint profiles_day_cutoff_hour_faixa check (day_cutoff_hour between 0 and 6),
  reminder_hour int not null default 19
    constraint profiles_reminder_hour_faixa check (reminder_hour between 0 and 23),
  is_adult_confirmed boolean not null default false,
  adult_confirmed_at timestamptz,
  -- TODO(fase 2): foreign key para dogs(id) e garantia de que o cão é do próprio dono.
  -- TODO(fase 3): grant de update em active_dog_id (F11).
  active_dog_id uuid,
  created_at timestamptz not null default now(),
  constraint profiles_adulto_com_data check (not is_adult_confirmed or adult_confirmed_at is not null)
);

comment on table public.profiles is 'Perfil do tutor (1:1 com auth.users). Escrita do app só por grant de coluna e confirm_adult().';
comment on column public.profiles.day_cutoff_hour is 'Hora (0-6) em que vira o dia lógico do tutor (ADR-05).';

alter table public.profiles enable row level security;

create policy "profiles: dono lê" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: dono altera" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sem insert nem delete pelo app: o trigger cria e o cascade de auth.users apaga.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, timezone, day_cutoff_hour, reminder_hour) on public.profiles to authenticated;

-- Fuso válido: conferido contra pg_timezone_names (não cabe numa check constraint).
create function public.profiles_validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'fuso horário inválido: %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.profiles_validate_timezone();

-- Cria o perfil quando o usuário nasce no Auth. Nome: o do provedor, a parte local do
-- e-mail ou "Tutor", sempre com 1 a 40 caracteres.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), '')
  );
  v_name := nullif(btrim(left(v_name, 40)), '');

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(v_name, 'Tutor'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.profiles_validate_timezone() from public, anon, authenticated;

-- F02: autodeclaração de maioridade (ADR-08). Idempotente: a data da 1ª confirmação fica.
create function public.confirm_adult()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  update public.profiles
     set is_adult_confirmed = true,
         adult_confirmed_at = coalesce(adult_confirmed_at, now())
   where id = v_uid;

  if not found then
    raise exception 'perfil não encontrado' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.confirm_adult() from public, anon;
grant execute on function public.confirm_adult() to authenticated;
