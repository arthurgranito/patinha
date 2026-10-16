-- Fase 2 — correções da revisão de segurança.
--   1. Caminho de serviço do BEFORE de training_sessions: `postgres` só conta sem JWT
--      (auth.role() nulo). Uma RPC security definer chamada pelo app (Fases 6 e 10) roda como
--      postgres mas com o JWT do usuário, e continua tratada como usuário.
--   2. Lock em dog_programs no AFTER: avanço do plano sem corrida entre sessões paralelas.

create or replace function public.training_sessions_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_servico constant boolean := coalesce((select auth.role()), '') = 'service_role'
    or (current_user = 'postgres' and (select auth.role()) is null);
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
  -- TODO(fase 6): carência para trocar fuso/virada (docs/flows.md, seção 5). Sem ela, o tutor
  -- troca o fuso entre dois inserts e grava um dia lógico que já fechou no fuso dele.
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

create or replace function public.training_sessions_after_insert()
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
    -- Serializa sessões do mesmo programa: sem o lock, as duas últimas do dia em paralelo
    -- não se veem e o dia não avança.
    perform 1 from public.dog_programs dp where dp.id = new.dog_program_id for update;

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

comment on table public.app_config is 'Feature flags públicas (F40), lidas por anon. Nunca guarde segredo aqui.';
