-- Fase 2 — Esquema completo, RLS e regras de negócio no banco (ADR-02, ADR-05, ADR-06).
-- Todas as tabelas do modelo de dados (exceto profiles, da Fase 1), com:
--   * RLS ligado em todas e grants explícitos (revoke all + grant do mínimo);
--   * escrita do app sempre exigindo 18+ confirmado (is_adult(), ADR-08);
--   * conteúdo (programs, exercises, program_items, challenges) só leitura e só publicado;
--   * tabelas derivadas (dog_programs, dog_skills, dog_days, streak_freezes, dog_achievements)
--     só leitura para o dono: quem escreve são os triggers e as RPCs das próximas fases.
-- Mensagens de erro que chegam à tela são as do docs/flows.md. Códigos próprios (classe PA):
--   PA001 limite de cães do plano grátis · PA002 limite de 5 cães · PA003 conteúdo Premium
--   PA004 sessão fora de hoje/ontem.

-- =====================================================================================
-- Funções auxiliares
-- =====================================================================================

-- 18+ confirmado do usuário da requisição (lacuna da Fase 1: quem chama o PostgREST direto
-- pula o onboarding). Usada no `with check` de toda escrita nova.
create function public.is_adult()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_adult_confirmed from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke execute on function public.is_adult() from public, anon;
grant execute on function public.is_adult() to authenticated;

-- =====================================================================================
-- Cães
-- =====================================================================================

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null
    constraint dogs_name_tamanho check (char_length(name) between 1 and 30 and btrim(name) <> '')
    constraint dogs_name_sem_controle check (name !~ '[\x01-\x1f\x7f-\x9f‎‏‪-‮⁦-⁩]'),
  -- Caminho dentro do bucket dog-photos (Fase 3): <owner_id>/<arquivo>.
  photo_path text,
  birth_month date not null
    constraint dogs_birth_month_dia_1 check (extract(day from birth_month) = 1),
  size text not null
    constraint dogs_size_valido check (size in ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
  breed text
    constraint dogs_breed_tamanho check (breed is null or (char_length(breed) between 1 and 60 and btrim(breed) <> '')),
  is_srd boolean not null default false,
  energy text not null
    constraint dogs_energy_valida check (energy in ('baixa', 'media', 'alta')),
  daily_minutes int not null
    constraint dogs_daily_minutes_valido check (daily_minutes in (5, 10, 15)),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint dogs_photo_path_do_dono check (
    photo_path is null
    or (split_part(photo_path, '/', 1) = owner_id::text
        and photo_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9_-][A-Za-z0-9_.-]{0,99}$'
        and photo_path !~ '\.\.')
  )
);

comment on table public.dogs is 'Cães do tutor. Limite de ativos (1 grátis, 5 Premium) garantido por trigger.';

create index dogs_owner_ativos_idx on public.dogs (owner_id) where archived_at is null;

create table public.dog_goals (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  goal_code text not null
    constraint dog_goals_goal_code_valido
    check (goal_code in ('xixi', 'guia', 'latido', 'mordida', 'pular', 'chamado', 'sozinho', 'truques', 'filhote')),
  -- Triagem (ADR-07): objetivo grave não recebe plano automático.
  flagged_severe boolean not null default false,
  primary key (dog_id, goal_code)
);

-- profiles.active_dog_id (TODO da Fase 1): FK com set null e o cão precisa ser do próprio tutor.
alter table public.profiles
  add constraint profiles_active_dog_id_fkey
  foreign key (active_dog_id) references public.dogs (id) on delete set null;

create function public.profiles_validate_active_dog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active_dog_id is not null and not exists (
    select 1 from public.dogs d
     where d.id = new.active_dog_id and d.owner_id = new.id and d.archived_at is null
  ) then
    raise exception 'Isso não é seu.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_active_dog
  before insert or update of active_dog_id on public.profiles
  for each row execute function public.profiles_validate_active_dog();

-- =====================================================================================
-- Conteúdo (escrito só pela service role: Edge Function import-content, Fase 4)
-- =====================================================================================

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint programs_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title text not null
    constraint programs_title_tamanho check (char_length(title) between 1 and 120 and btrim(title) <> ''),
  summary text
    constraint programs_summary_tamanho check (summary is null or char_length(summary) between 1 and 300),
  goal_code text not null
    constraint programs_goal_code_valido
    check (goal_code in ('xixi', 'guia', 'latido', 'mordida', 'pular', 'chamado', 'sozinho', 'truques', 'filhote')),
  weeks int not null constraint programs_weeks_faixa check (weeks between 1 and 52),
  min_age_weeks int not null default 8 constraint programs_min_age_faixa check (min_age_weeks between 0 and 520),
  is_premium boolean not null default false,
  published boolean not null default false,
  reviewed_by text constraint programs_reviewed_by_tamanho check (reviewed_by is null or char_length(reviewed_by) between 1 and 120),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  constraint programs_publicado_revisado check (not published or reviewed_by is not null)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    constraint exercises_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title text not null
    constraint exercises_title_tamanho check (char_length(title) between 1 and 120 and btrim(title) <> ''),
  category text not null
    constraint exercises_category_valida check (category in ('obediencia', 'comportamento', 'truque', 'enriquecimento')),
  goal_codes text[] not null default '{}'
    constraint exercises_goal_codes_validos
    check (goal_codes <@ array['xixi', 'guia', 'latido', 'mordida', 'pular', 'chamado', 'sozinho', 'truques', 'filhote']::text[]),
  summary text not null
    constraint exercises_summary_tamanho check (char_length(summary) between 1 and 300 and btrim(summary) <> ''),
  steps jsonb not null
    constraint exercises_steps_lista check (case when jsonb_typeof(steps) = 'array' then jsonb_array_length(steps) >= 1 else false end),
  levels jsonb not null
    constraint exercises_levels_quatro check (case when jsonb_typeof(levels) = 'array' then jsonb_array_length(levels) = 4 else false end),
  tips jsonb not null default '[]'
    constraint exercises_tips_lista check (jsonb_typeof(tips) = 'array'),
  safety_note text
    constraint exercises_safety_note_tamanho check (safety_note is null or char_length(safety_note) between 1 and 300),
  video_url text constraint exercises_video_url_https check (video_url is null or video_url ~ '^https://\S+$'),
  duration_min int not null constraint exercises_duration_faixa check (duration_min between 1 and 30),
  min_age_weeks int not null default 8 constraint exercises_min_age_faixa check (min_age_weeks between 0 and 520),
  is_premium boolean not null default false,
  published boolean not null default false,
  reviewed_by text constraint exercises_reviewed_by_tamanho check (reviewed_by is null or char_length(reviewed_by) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint exercises_publicado_revisado check (not published or reviewed_by is not null)
);

comment on table public.exercises is
  'Exercícios. O app lê só as colunas de listagem; vídeo, passos, níveis, dicas e segurança saem por get_exercise().';

create table public.program_items (
  program_id uuid not null references public.programs (id) on delete cascade,
  day_index int not null constraint program_items_day_faixa check (day_index >= 1),
  position int not null constraint program_items_position_faixa check (position >= 1),
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  target_level int not null constraint program_items_target_level_faixa check (target_level between 1 and 4),
  -- A PK já serve de índice para (program_id, day_index).
  primary key (program_id, day_index, position)
);

create index program_items_exercise_idx on public.program_items (exercise_id);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  month date not null unique constraint challenges_month_dia_1 check (extract(day from month) = 1),
  title text not null
    constraint challenges_title_tamanho check (char_length(title) between 1 and 120 and btrim(title) <> ''),
  summary text constraint challenges_summary_tamanho check (summary is null or char_length(summary) between 1 and 300),
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  is_premium boolean not null default false,
  published boolean not null default false,
  reviewed_by text constraint challenges_reviewed_by_tamanho check (reviewed_by is null or char_length(reviewed_by) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint challenges_publicado_revisado check (not published or reviewed_by is not null)
);

-- =====================================================================================
-- Plano, treino e gamificação do cão
-- =====================================================================================

create table public.dog_programs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete restrict,
  started_on date not null,
  current_day int not null default 1 constraint dog_programs_current_day_faixa check (current_day >= 1),
  status text not null default 'ativo'
    constraint dog_programs_status_valido check (status in ('ativo', 'pausado', 'concluido')),
  created_at timestamptz not null default now(),
  unique (dog_id, program_id)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Conteúdo se despublica, não se apaga: restrict preserva o histórico.
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  dog_program_id uuid references public.dog_programs (id) on delete set null,
  -- Dia do programa em que a sessão foi feita (gravado pelo trigger; base do avanço do plano).
  program_day int constraint training_sessions_program_day_faixa check (program_day is null or program_day >= 1),
  -- Nível praticado (gravado pelo trigger a partir de dog_skills).
  level int not null constraint training_sessions_level_faixa check (level between 1 and 4),
  result text not null
    constraint training_sessions_result_valido check (result in ('conseguiu', 'quase', 'ainda_nao')),
  duration_sec int not null default 0 constraint training_sessions_duration_faixa check (duration_sec between 0 and 7200),
  -- Hora real do treino (pode vir da fila offline, Fase 10); nunca no futuro.
  done_at timestamptz not null default now(),
  -- Dia lógico do tutor (ADR-05), calculado pelo trigger.
  done_on date not null,
  source text not null default 'app' constraint training_sessions_source_valido check (source in ('app', 'offline')),
  -- Hora em que o banco recebeu: base da janela de 24 h do desfazer (F21).
  created_at timestamptz not null default now()
);

create index training_sessions_dog_dia_idx on public.training_sessions (dog_id, done_on);
create index training_sessions_dog_exercicio_idx on public.training_sessions (dog_id, exercise_id, done_at desc);
create index training_sessions_user_idx on public.training_sessions (user_id);
create index training_sessions_dog_program_idx on public.training_sessions (dog_program_id, program_day)
  where dog_program_id is not null;

create table public.dog_skills (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  level int not null default 0 constraint dog_skills_level_faixa check (level between 0 and 4),
  streak_success int not null default 0 constraint dog_skills_streak_faixa check (streak_success between 0 and 2),
  mastered_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (dog_id, exercise_id),
  constraint dog_skills_dominado_no_4 check (mastered_at is null or level = 4)
);

create table public.dog_days (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  day date not null,
  status text not null constraint dog_days_status_valido check (status in ('treinou', 'congelado')),
  primary key (dog_id, day)
);

create table public.streak_freezes (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (dog_id, day)
);

create table public.dog_achievements (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  code text not null constraint dog_achievements_code_formato check (code ~ '^[a-z0-9_]{1,60}$'),
  awarded_at timestamptz not null default now(),
  primary key (dog_id, code)
);

create table public.challenge_entries (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  joined_at timestamptz not null default now(),
  -- Gravado pelo banco quando o cão domina o exercício no mês (Fase 11).
  completed_at timestamptz,
  primary key (challenge_id, dog_id)
);

-- =====================================================================================
-- Conta: push, assinatura e configuração
-- =====================================================================================

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  token text not null unique
    constraint push_tokens_token_formato check (token ~ '^Expo(nent)?PushToken\[[^\]]{1,200}\]$'),
  platform text not null constraint push_tokens_platform_valida check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  -- Última vez que o app confirmou o token (F43 apaga os parados há 90 dias).
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

-- Escrita só pelo webhook do RevenueCat (service role, Fase 12). ADR-06.
create table public.entitlements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  entitlement text not null default 'premium' constraint entitlements_entitlement_valido check (entitlement = 'premium'),
  status text not null
    constraint entitlements_status_valido check (status in ('ativo', 'teste', 'expirado', 'cancelado', 'cobranca_falhou')),
  expires_at timestamptz,
  store text constraint entitlements_store_valida check (store is null or store in ('app_store', 'play_store')),
  product_id text constraint entitlements_product_id_tamanho check (product_id is null or char_length(product_id) between 1 and 200),
  updated_at timestamptz not null default now()
);

-- Feature flags e operação (F40). Lida por todos; escrita pelo Studio (service role).
create table public.app_config (
  key text primary key constraint app_config_key_formato check (key ~ '^[a-z][a-z0-9_]{0,59}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- =====================================================================================
-- Funções de regra (ADR-02, ADR-05, ADR-06)
-- =====================================================================================

-- O cão é do usuário da requisição? Base das políticas das tabelas do cão.
create function public.owns_dog(p_dog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.dogs d where d.id = p_dog_id and d.owner_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_dog(uuid) from public, anon;
grant execute on function public.owns_dog(uuid) to authenticated;

-- Dia lógico do tutor (ADR-05): data local no fuso do perfil, com a virada em day_cutoff_hour.
-- Quem chama com JWT de usuário (anon/authenticated) só consulta o próprio dia.
create function public.user_day(p_user_id uuid, p_ts timestamptz default now())
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz text;
  v_cutoff int;
begin
  if (select auth.role()) in ('anon', 'authenticated') and p_user_id is distinct from (select auth.uid()) then
    raise exception 'Isso não é seu.' using errcode = '42501';
  end if;

  select p.timezone, p.day_cutoff_hour into v_tz, v_cutoff
    from public.profiles p where p.id = p_user_id;
  if not found then
    raise exception 'perfil não encontrado' using errcode = 'P0002';
  end if;

  return ((p_ts at time zone v_tz) - make_interval(hours => v_cutoff))::date;
end;
$$;

revoke execute on function public.user_day(uuid, timestamptz) from public, anon;
grant execute on function public.user_day(uuid, timestamptz) to authenticated;

-- Premium vigente (ADR-06, F36): qualquer estado que não seja "expirado", com expires_at no futuro.
-- "cancelado" e "cobranca_falhou" mantêm o acesso até expires_at.
-- Quem chama com JWT de usuário só consulta o próprio Premium.
create function public.is_premium(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) in ('anon', 'authenticated') and p_user_id is distinct from (select auth.uid()) then
    raise exception 'Isso não é seu.' using errcode = '42501';
  end if;

  return exists (
    select 1 from public.entitlements e
     where e.user_id = p_user_id
       and e.entitlement = 'premium'
       and e.status <> 'expirado'
       and e.expires_at > now()
  );
end;
$$;

revoke execute on function public.is_premium(uuid) from public, anon;
grant execute on function public.is_premium(uuid) to authenticated;

-- F16: detalhe do exercício. Vídeo, passos, níveis, dicas e segurança só para conteúdo grátis
-- ou para quem é Premium; senão, só título e resumo com locked = true. Não publicado: nenhuma linha.
create function public.get_exercise(p_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  summary text,
  category text,
  is_premium boolean,
  duration_min int,
  min_age_weeks int,
  locked boolean,
  video_url text,
  steps jsonb,
  levels jsonb,
  tips jsonb,
  safety_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ex public.exercises;
  v_locked boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  select * into v_ex from public.exercises e where e.slug = p_slug and e.published;
  if not found then
    return;
  end if;

  v_locked := v_ex.is_premium and not public.is_premium((select auth.uid()));

  return query select
    v_ex.id, v_ex.slug, v_ex.title, v_ex.summary, v_ex.category, v_ex.is_premium,
    v_ex.duration_min, v_ex.min_age_weeks, v_locked,
    case when v_locked then null else v_ex.video_url end,
    case when v_locked then null else v_ex.steps end,
    case when v_locked then null else v_ex.levels end,
    case when v_locked then null else v_ex.tips end,
    case when v_locked then null else v_ex.safety_note end;
end;
$$;

revoke execute on function public.get_exercise(text) from public, anon;
grant execute on function public.get_exercise(text) to authenticated;

-- =====================================================================================
-- Triggers
-- =====================================================================================

-- (a) Limite de cães ativos: 1 no grátis, 5 no Premium (F08 9e, F10). Vale também para
-- reativar um cão arquivado (F12). Usa só NEW.owner_id; o lock evita corrida entre inserts.
create function public.dogs_enforce_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_premium boolean;
  v_ativos int;
begin
  if new.archived_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('dogs_limit:' || new.owner_id::text, 0));

  v_premium := public.is_premium(new.owner_id);
  select count(*) into v_ativos
    from public.dogs d
   where d.owner_id = new.owner_id and d.archived_at is null and d.id <> new.id;

  if v_premium and v_ativos >= 5 then
    raise exception 'Você chegou ao limite de 5 cães. Arquive um para adicionar outro.'
      using errcode = 'PA002', hint = 'limite_caes_premium';
  elsif not v_premium and v_ativos >= 1 then
    raise exception 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.'
      using errcode = 'PA001', hint = 'limite_caes_gratis';
  end if;
  return new;
end;
$$;

create trigger dogs_enforce_limit
  before insert or update of archived_at on public.dogs
  for each row execute function public.dogs_enforce_limit();

-- (b) BEFORE INSERT em training_sessions (F19 passo 2). Roda como quem insere (security
-- invoker), para current_user ser o papel real. Só a service role e o postgres (seed, Studio)
-- gravam sessões antigas; o app nunca pula a janela de hoje/ontem.
create function public.training_sessions_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_servico constant boolean := coalesce((select auth.role()), '') = 'service_role' or current_user = 'postgres';
  v_uid constant uuid := (select auth.uid());
  v_dono uuid;
  v_publicado boolean;
  v_ex_premium boolean;
  v_hoje date;
  v_dp_dog uuid;
  v_dp_dia int;
  v_dp_status text;
  v_nivel int;
begin
  if v_servico then
    if new.user_id is null then
      raise exception 'user_id é obrigatório' using errcode = '23502';
    end if;
  else
    if v_uid is null then
      raise exception 'não autenticado' using errcode = '42501';
    end if;
    if new.user_id is null then
      new.user_id := v_uid;
    elsif new.user_id <> v_uid then
      raise exception 'Isso não é seu.' using errcode = '42501';
    end if;
    if not public.is_adult() then
      raise exception 'Confirme que você tem 18 anos ou mais.' using errcode = '42501';
    end if;
  end if;

  -- O cão precisa ser do usuário (para o app, a RLS de dogs já esconde os cães alheios).
  select d.owner_id into v_dono
    from public.dogs d where d.id = new.dog_id and d.archived_at is null;
  if v_dono is null or v_dono <> new.user_id then
    raise exception 'Isso não é seu.' using errcode = '42501';
  end if;

  -- Exercício publicado e, se Premium, assinatura vigente (F19 2e, F38).
  select e.published, e.is_premium into v_publicado, v_ex_premium
    from public.exercises e where e.id = new.exercise_id;
  if not coalesce(v_publicado, false) then
    raise exception 'Exercício não encontrado.' using errcode = 'P0002';
  end if;
  if v_ex_premium and not public.is_premium(new.user_id) then
    raise exception 'Esse exercício é do Premium.' using errcode = 'PA003';
  end if;

  -- Dia lógico (ADR-05) e janela de hoje/ontem (F19 2e, F31).
  new.done_at := coalesce(new.done_at, now());
  if new.done_at > now() + interval '5 minutes' then
    raise exception 'done_at no futuro' using errcode = '22023';
  end if;
  new.done_on := public.user_day(new.user_id, new.done_at);
  if not v_servico then
    v_hoje := public.user_day(new.user_id, now());
    if new.done_on not in (v_hoje, v_hoje - 1) then
      raise exception 'Um treino não pôde ser salvo porque passou do prazo (só hoje ou ontem).'
        using errcode = 'PA004';
    end if;
  end if;

  new.created_at := now();

  -- Programa: precisa ser do mesmo cão; só o programa ativo registra o dia (avanço do plano).
  new.program_day := null;
  if new.dog_program_id is not null then
    select dp.dog_id, dp.current_day, dp.status into v_dp_dog, v_dp_dia, v_dp_status
      from public.dog_programs dp where dp.id = new.dog_program_id;
    if v_dp_dog is null or v_dp_dog <> new.dog_id then
      raise exception 'Isso não é seu.' using errcode = '42501';
    end if;
    if v_dp_status = 'ativo' then
      new.program_day := v_dp_dia;
    end if;
  end if;

  -- O nível praticado é o atual do cão no exercício (o primeiro treino é no nível 1).
  select s.level into v_nivel
    from public.dog_skills s where s.dog_id = new.dog_id and s.exercise_id = new.exercise_id;
  new.level := greatest(coalesce(v_nivel, 0), 1);

  return new;
end;
$$;

create trigger training_sessions_before_insert
  before insert on public.training_sessions
  for each row execute function public.training_sessions_before_insert();

-- (c) AFTER INSERT em training_sessions (F19 passo 3). Security definer porque grava em tabelas
-- só de leitura para o dono; usa apenas os valores de NEW, já validados no BEFORE.
--   * progressão: "conseguiu" +1; "quase" mantém; "ainda_nao" zera; 3 acertos sobem de nível
--     (máximo 4); no nível 4, 3 acertos gravam mastered_at (truque dominado);
--   * dog_days: o dia lógico conta como "treinou" (tentar já conta);
--   * plano: com todos os itens do dia feitos, avança current_day (no último dia, "concluido").
-- TODO(fase 6): o desfazer (F21) precisa de recompute_skill e de recalcular o dog_days do dia
--   (apagar a última sessão do dia deixa o dia como "treinou").
-- TODO(fase 7): avaliar as conquistas (F24) aqui.
create function public.training_sessions_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level int;
  v_streak int;
  v_mastered timestamptz;
  v_total int;
  v_feitos int;
  v_ultimo int;
begin
  insert into public.dog_skills (dog_id, exercise_id, level, streak_success)
  values (new.dog_id, new.exercise_id, 1, 0)
  on conflict (dog_id, exercise_id) do nothing;

  select s.level, s.streak_success, s.mastered_at into v_level, v_streak, v_mastered
    from public.dog_skills s
   where s.dog_id = new.dog_id and s.exercise_id = new.exercise_id
     for update;

  v_level := greatest(v_level, 1);
  if new.result = 'conseguiu' then
    v_streak := v_streak + 1;
    if v_streak >= 3 then
      v_streak := 0;
      if v_level < 4 then
        v_level := v_level + 1;
      else
        v_mastered := coalesce(v_mastered, new.done_at);
      end if;
    end if;
  elsif new.result = 'ainda_nao' then
    v_streak := 0;
  end if;

  update public.dog_skills s
     set level = v_level, streak_success = v_streak, mastered_at = v_mastered, updated_at = now()
   where s.dog_id = new.dog_id and s.exercise_id = new.exercise_id;

  insert into public.dog_days (dog_id, day, status)
  values (new.dog_id, new.done_on, 'treinou')
  on conflict (dog_id, day) do update set status = 'treinou';

  if new.program_day is not null then
    select count(distinct pi.exercise_id),
           count(distinct pi.exercise_id) filter (where exists (
             select 1 from public.training_sessions ts
              where ts.dog_program_id = new.dog_program_id
                and ts.program_day = new.program_day
                and ts.exercise_id = pi.exercise_id))
      into v_total, v_feitos
      from public.program_items pi
      join public.dog_programs dp on dp.program_id = pi.program_id
     where dp.id = new.dog_program_id and pi.day_index = new.program_day;

    if v_total > 0 and v_feitos = v_total then
      select max(pi.day_index) into v_ultimo
        from public.program_items pi
        join public.dog_programs dp on dp.program_id = pi.program_id
       where dp.id = new.dog_program_id;

      update public.dog_programs dp
         set current_day = case when dp.current_day >= v_ultimo then dp.current_day else dp.current_day + 1 end,
             status = case when dp.current_day >= v_ultimo then 'concluido' else dp.status end
       where dp.id = new.dog_program_id and dp.current_day = new.program_day and dp.status = 'ativo';
    end if;
  end if;

  return null;
end;
$$;

create trigger training_sessions_after_insert
  after insert on public.training_sessions
  for each row execute function public.training_sessions_after_insert();

revoke execute on function public.profiles_validate_active_dog() from public, anon, authenticated;
revoke execute on function public.dogs_enforce_limit() from public, anon, authenticated;
revoke execute on function public.training_sessions_before_insert() from public, anon, authenticated;
revoke execute on function public.training_sessions_after_insert() from public, anon, authenticated;

-- =====================================================================================
-- RLS e grants
-- =====================================================================================

alter table public.dogs enable row level security;
alter table public.dog_goals enable row level security;
alter table public.programs enable row level security;
alter table public.exercises enable row level security;
alter table public.program_items enable row level security;
alter table public.challenges enable row level security;
alter table public.dog_programs enable row level security;
alter table public.training_sessions enable row level security;
alter table public.dog_skills enable row level security;
alter table public.dog_days enable row level security;
alter table public.streak_freezes enable row level security;
alter table public.dog_achievements enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.push_tokens enable row level security;
alter table public.entitlements enable row level security;
alter table public.app_config enable row level security;

revoke all on
  public.dogs, public.dog_goals, public.programs, public.exercises, public.program_items,
  public.challenges, public.dog_programs, public.training_sessions, public.dog_skills,
  public.dog_days, public.streak_freezes, public.dog_achievements, public.challenge_entries,
  public.push_tokens, public.entitlements, public.app_config
from anon, authenticated;

-- dogs: só o dono. owner_id não muda depois de criado (fora do grant de update).
create policy "dogs: dono lê" on public.dogs
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "dogs: dono cria (18+)" on public.dogs
  for insert to authenticated with check (owner_id = (select auth.uid()) and (select public.is_adult()));
create policy "dogs: dono altera (18+)" on public.dogs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (select public.is_adult()));
create policy "dogs: dono apaga" on public.dogs
  for delete to authenticated using (owner_id = (select auth.uid()));

grant select, delete on public.dogs to authenticated;
grant insert (id, owner_id, name, photo_path, birth_month, size, breed, is_srd, energy, daily_minutes)
  on public.dogs to authenticated;
grant update (name, photo_path, birth_month, size, breed, is_srd, energy, daily_minutes, archived_at)
  on public.dogs to authenticated;

-- dog_goals: só o dono do cão.
create policy "dog_goals: dono lê" on public.dog_goals
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "dog_goals: dono cria (18+)" on public.dog_goals
  for insert to authenticated with check ((select public.owns_dog(dog_id)) and (select public.is_adult()));
create policy "dog_goals: dono altera (18+)" on public.dog_goals
  for update to authenticated
  using ((select public.owns_dog(dog_id)))
  with check ((select public.owns_dog(dog_id)) and (select public.is_adult()));
create policy "dog_goals: dono apaga" on public.dog_goals
  for delete to authenticated using ((select public.owns_dog(dog_id)));

grant select, delete on public.dog_goals to authenticated;
grant insert (dog_id, goal_code, flagged_severe) on public.dog_goals to authenticated;
grant update (flagged_severe) on public.dog_goals to authenticated;

-- Conteúdo: autenticado lê só o publicado; escrita só service role (sem grant).
create policy "programs: publicados" on public.programs
  for select to authenticated using (published);
create policy "exercises: publicados" on public.exercises
  for select to authenticated using (published);
create policy "program_items: de programa publicado" on public.program_items
  for select to authenticated
  using (exists (select 1 from public.programs p where p.id = program_id and p.published));
create policy "challenges: publicados" on public.challenges
  for select to authenticated using (published);

grant select on public.programs, public.program_items, public.challenges to authenticated;
-- exercises: só as colunas de listagem; o resto passa por get_exercise() (cadeado Premium).
grant select (id, slug, title, category, goal_codes, summary, duration_min, min_age_weeks, is_premium, published, created_at)
  on public.exercises to authenticated;

-- Tabelas derivadas: o dono só lê.
create policy "dog_programs: dono lê" on public.dog_programs
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "dog_skills: dono lê" on public.dog_skills
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "dog_days: dono lê" on public.dog_days
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "streak_freezes: dono lê" on public.streak_freezes
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "dog_achievements: dono lê" on public.dog_achievements
  for select to authenticated using ((select public.owns_dog(dog_id)));

grant select on public.dog_programs, public.dog_skills, public.dog_days, public.streak_freezes, public.dog_achievements
  to authenticated;

-- training_sessions: insert validado pelo trigger; sem update; desfazer só o próprio, até 24 h
-- depois de o banco receber (created_at), para a fila offline continuar desfazível.
create policy "training_sessions: dono lê" on public.training_sessions
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "training_sessions: dono registra (18+)" on public.training_sessions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.owns_dog(dog_id)) and (select public.is_adult()));
create policy "training_sessions: desfaz o próprio até 24 h" on public.training_sessions
  for delete to authenticated
  using (user_id = (select auth.uid()) and created_at > now() - interval '24 hours');

grant select, delete on public.training_sessions to authenticated;
grant insert (id, dog_id, user_id, exercise_id, dog_program_id, level, result, duration_sec, done_at, source)
  on public.training_sessions to authenticated;

-- challenge_entries: o dono inscreve o cão num desafio publicado; Premium exige assinatura.
-- completed_at é do banco (Fase 11).
create policy "challenge_entries: dono lê" on public.challenge_entries
  for select to authenticated using ((select public.owns_dog(dog_id)));
create policy "challenge_entries: dono participa (18+)" on public.challenge_entries
  for insert to authenticated
  with check (
    (select public.owns_dog(dog_id))
    and (select public.is_adult())
    and exists (
      select 1 from public.challenges c
       where c.id = challenge_id and c.published
         and (not c.is_premium or public.is_premium((select auth.uid())))
    )
  );

grant select on public.challenge_entries to authenticated;
grant insert (challenge_id, dog_id) on public.challenge_entries to authenticated;

-- push_tokens: só do dono. TODO(fase 8): upsert_push_token (troca de dono do aparelho).
create policy "push_tokens: dono lê" on public.push_tokens
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push_tokens: dono cria (18+)" on public.push_tokens
  for insert to authenticated with check (user_id = (select auth.uid()) and (select public.is_adult()));
create policy "push_tokens: dono apaga" on public.push_tokens
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, delete on public.push_tokens to authenticated;
grant insert (user_id, token, platform) on public.push_tokens to authenticated;

-- entitlements: cada um lê só o próprio; escrita só service role (webhook, Fase 12).
create policy "entitlements: dono lê" on public.entitlements
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.entitlements to authenticated;

-- app_config: flags públicas, lidas antes do login (manutenção).
create policy "app_config: todos leem" on public.app_config
  for select to anon, authenticated using (true);

grant select on public.app_config to anon, authenticated;
