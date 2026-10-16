-- Fase 2 — trigger AFTER INSERT de training_sessions (F19 passo 3): progressão em dog_skills,
-- dog_days e avanço do plano. Tudo registrado por um usuário comum (authenticated).
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email) values ('60000000-0000-4000-8000-000000000001', 'g1@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id = '60000000-0000-4000-8000-000000000001';
insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('60000000-0000-4000-8000-0000000000d1', '60000000-0000-4000-8000-000000000001', 'Caramelo', '2026-01-01', 'medio', 'alta', 10);
insert into public.exercises (id, slug, title, category, summary, steps, levels, duration_min, published, reviewed_by) values
  ('60000000-0000-4000-8000-0000000000e1', 'g-senta', 'Senta', 'obediencia', 'Resumo', '["a"]', '[1,2,3,4]', 3, true, 'teste'),
  ('60000000-0000-4000-8000-0000000000e2', 'g-deita', 'Deita', 'obediencia', 'Resumo', '["a"]', '[1,2,3,4]', 3, true, 'teste'),
  ('60000000-0000-4000-8000-0000000000e3', 'g-fica', 'Fica', 'obediencia', 'Resumo', '["a"]', '[1,2,3,4]', 3, true, 'teste');
insert into public.programs (id, slug, title, goal_code, weeks, published, reviewed_by) values
  ('60000000-0000-4000-8000-0000000000f1', 'g-base', 'Base', 'filhote', 1, true, 'teste');
insert into public.program_items (program_id, day_index, position, exercise_id, target_level) values
  ('60000000-0000-4000-8000-0000000000f1', 1, 1, '60000000-0000-4000-8000-0000000000e1', 1),
  ('60000000-0000-4000-8000-0000000000f1', 1, 2, '60000000-0000-4000-8000-0000000000e2', 1),
  ('60000000-0000-4000-8000-0000000000f1', 2, 1, '60000000-0000-4000-8000-0000000000e1', 1);
insert into public.dog_programs (id, dog_id, program_id, started_on) values
  ('60000000-0000-4000-8000-0000000000c1', '60000000-0000-4000-8000-0000000000d1', '60000000-0000-4000-8000-0000000000f1', current_date);

-- Registra uma sessão como o tutor.
create function pg_temp.treina(p_ex uuid, p_result text, p_prog uuid default null, p_done_at timestamptz default now())
returns void language sql as $$
  insert into public.training_sessions (dog_id, exercise_id, result, dog_program_id, done_at)
  values ('60000000-0000-4000-8000-0000000000d1', p_ex, p_result, p_prog, p_done_at);
$$;

create function pg_temp.skill(p_ex uuid) returns text language sql as $$
  select level || '/' || streak_success || '/' || (mastered_at is not null)
    from public.dog_skills where dog_id = '60000000-0000-4000-8000-0000000000d1' and exercise_id = p_ex;
$$;

select ok(
  (select prosecdef from pg_proc where oid = 'public.training_sessions_after_insert()'::regprocedure),
  'trigger AFTER é security definer'
);
select is(
  (select proconfig from pg_proc where oid = 'public.training_sessions_after_insert()'::regprocedure),
  array['search_path=""'], 'trigger AFTER tem search_path vazio'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "60000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select throws_ok(
  $$ insert into public.dog_skills (dog_id, exercise_id, level) values ('60000000-0000-4000-8000-0000000000d1', '60000000-0000-4000-8000-0000000000e3', 4) $$,
  '42501', null, 'tutor não grava dog_skills direto'
);
select throws_ok(
  $$ update public.dog_programs set current_day = 9 where id = '60000000-0000-4000-8000-0000000000c1' $$,
  '42501', null, 'tutor não altera dog_programs direto'
);

-- Progressão (sessões de treino livre)
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '1/1/false', '1º acerto: nível 1, 1 acerto');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'quase');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '1/1/false', '"quase" mantém o contador');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'ainda_nao');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '1/0/false', '"ainda_nao" zera o contador');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '1/2/false', '2 acertos seguidos ainda no nível 1');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '2/0/false', '3 acertos seguidos sobem para o nível 2 e zeram o contador');
select is(
  (select level from public.training_sessions
    where dog_id = '60000000-0000-4000-8000-0000000000d1' and exercise_id = '60000000-0000-4000-8000-0000000000e3'
    order by created_at desc, level desc limit 1),
  1, 'a sessão grava o nível praticado (1)'
);
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select is(
  (select max(level) from public.training_sessions
    where dog_id = '60000000-0000-4000-8000-0000000000d1' and exercise_id = '60000000-0000-4000-8000-0000000000e3'),
  2, 'a sessão seguinte já é no nível 2'
);

-- Leva ao nível 4 (3 acertos por nível) e domina.
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu') from generate_series(1, 2);
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '3/0/false', 'nível 3');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu') from generate_series(1, 3);
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '4/0/false', 'nível 4 ainda sem mastered_at');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu') from generate_series(1, 2);
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '4/2/false', 'nível 4 com 2 acertos');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu');
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '4/0/true', 'nível 4 com 3 acertos grava mastered_at (truque dominado)');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'conseguiu') from generate_series(1, 3);
select is(pg_temp.skill('60000000-0000-4000-8000-0000000000e3'), '4/0/true', 'depois de dominado continua no nível 4');

-- dog_days: o dia lógico conta como treinado, e treinar num dia congelado vira "treinou".
select is(
  (select status from public.dog_days where dog_id = '60000000-0000-4000-8000-0000000000d1'
      and day = public.user_day('60000000-0000-4000-8000-000000000001')),
  'treinou', 'dog_days marca o dia de hoje como treinado'
);
reset role;
insert into public.dog_days (dog_id, day, status)
values ('60000000-0000-4000-8000-0000000000d1', public.user_day('60000000-0000-4000-8000-000000000001') - 1, 'congelado');
set local role authenticated;
select pg_temp.treina('60000000-0000-4000-8000-0000000000e3', 'ainda_nao', null, now() - interval '1 day');
select is(
  (select status from public.dog_days where dog_id = '60000000-0000-4000-8000-0000000000d1'
      and day = public.user_day('60000000-0000-4000-8000-000000000001') - 1),
  'treinou', 'treino num dia congelado vira "treinou" (tentar já conta)'
);

-- Avanço do plano: só quando todos os itens do dia têm sessão do programa.
select pg_temp.treina('60000000-0000-4000-8000-0000000000e1', 'quase', '60000000-0000-4000-8000-0000000000c1');
select is((select current_day from public.dog_programs where id = '60000000-0000-4000-8000-0000000000c1'), 1,
  'com 1 de 2 itens feitos, o plano fica no dia 1');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e2', 'conseguiu');
select is((select current_day from public.dog_programs where id = '60000000-0000-4000-8000-0000000000c1'), 1,
  'treino livre do item que faltava não avança o plano');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e2', 'ainda_nao', '60000000-0000-4000-8000-0000000000c1');
select is((select current_day from public.dog_programs where id = '60000000-0000-4000-8000-0000000000c1'), 2,
  'com todos os itens do dia feitos (qualquer resultado), o plano vai para o dia 2');
select pg_temp.treina('60000000-0000-4000-8000-0000000000e1', 'conseguiu', '60000000-0000-4000-8000-0000000000c1');
select results_eq(
  $$ select current_day, status from public.dog_programs where id = '60000000-0000-4000-8000-0000000000c1' $$,
  $$ values (2, 'concluido') $$,
  'no último dia, o plano fica concluído'
);
reset role;

select * from finish();
rollback;
