-- Fase 2 — privacidade (AGENTS.md, regra 5): um usuário não lê nem altera nada do cão de outro.
-- A tem um cão com dados em todas as tabelas; B (adulto, com o próprio cão) tenta tudo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(33);

create function pg_temp.linhas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

insert into auth.users (id, email) values
  ('80000000-0000-4000-8000-00000000000a', 'a@teste.local'),
  ('80000000-0000-4000-8000-00000000000b', 'b@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id in ('80000000-0000-4000-8000-00000000000a', '80000000-0000-4000-8000-00000000000b');

insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('80000000-0000-4000-8000-0000000000da', '80000000-0000-4000-8000-00000000000a', 'Caramelo', '2026-01-01', 'medio', 'alta', 10),
  ('80000000-0000-4000-8000-0000000000db', '80000000-0000-4000-8000-00000000000b', 'Thor', '2022-01-01', 'grande', 'media', 15);
update public.profiles set active_dog_id = '80000000-0000-4000-8000-0000000000da' where id = '80000000-0000-4000-8000-00000000000a';

insert into public.exercises (id, slug, title, category, summary, steps, levels, duration_min, published, reviewed_by) values
  ('80000000-0000-4000-8000-0000000000e1', 'i-senta', 'Senta', 'obediencia', 'Resumo', '["a"]', '[1,2,3,4]', 3, true, 'teste');
insert into public.programs (id, slug, title, goal_code, weeks, published, reviewed_by) values
  ('80000000-0000-4000-8000-0000000000f1', 'i-base', 'Base', 'filhote', 1, true, 'teste');
insert into public.program_items (program_id, day_index, position, exercise_id, target_level) values
  ('80000000-0000-4000-8000-0000000000f1', 1, 1, '80000000-0000-4000-8000-0000000000e1', 1);
insert into public.challenges (id, month, title, exercise_id, published, reviewed_by) values
  ('80000000-0000-4000-8000-0000000000c1', '2030-05-01', 'Mês do Senta', '80000000-0000-4000-8000-0000000000e1', true, 'teste');

-- Dados de A em todas as tabelas do cão.
insert into public.dog_goals (dog_id, goal_code) values ('80000000-0000-4000-8000-0000000000da', 'filhote');
insert into public.dog_programs (id, dog_id, program_id, started_on) values
  ('80000000-0000-4000-8000-0000000000aa', '80000000-0000-4000-8000-0000000000da', '80000000-0000-4000-8000-0000000000f1', current_date);
insert into public.training_sessions (id, dog_id, user_id, exercise_id, result) values
  ('80000000-0000-4000-8000-0000000005a1', '80000000-0000-4000-8000-0000000000da', '80000000-0000-4000-8000-00000000000a',
   '80000000-0000-4000-8000-0000000000e1', 'conseguiu');
insert into public.streak_freezes (dog_id, day) values ('80000000-0000-4000-8000-0000000000da', current_date - 3);
insert into public.dog_achievements (dog_id, code) values ('80000000-0000-4000-8000-0000000000da', 'primeiro_treino');
insert into public.challenge_entries (challenge_id, dog_id) values ('80000000-0000-4000-8000-0000000000c1', '80000000-0000-4000-8000-0000000000da');
insert into public.push_tokens (user_id, token, platform) values ('80000000-0000-4000-8000-00000000000a', 'ExponentPushToken[aaa]', 'ios');
insert into public.entitlements (user_id, status, expires_at) values ('80000000-0000-4000-8000-00000000000a', 'ativo', now() + interval '1 year');

-- Como B
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "80000000-0000-4000-8000-00000000000b", "role": "authenticated"}', true);

-- Leitura: nada de A aparece.
select is_empty($$ select 1 from public.profiles where id = '80000000-0000-4000-8000-00000000000a' $$, 'B não lê o perfil de A');
select is_empty($$ select 1 from public.dogs where id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê o cão de A');
select is_empty($$ select 1 from public.dog_goals where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê dog_goals de A');
select is_empty($$ select 1 from public.dog_programs where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê dog_programs de A');
select is_empty($$ select 1 from public.training_sessions where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê as sessões de A');
select is_empty($$ select 1 from public.dog_skills where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê dog_skills de A');
select is_empty($$ select 1 from public.dog_days where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê dog_days de A');
select is_empty($$ select 1 from public.streak_freezes where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê streak_freezes de A');
select is_empty($$ select 1 from public.dog_achievements where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê dog_achievements de A');
select is_empty($$ select 1 from public.challenge_entries where dog_id = '80000000-0000-4000-8000-0000000000da' $$, 'B não lê challenge_entries de A');
select is_empty($$ select 1 from public.push_tokens where user_id = '80000000-0000-4000-8000-00000000000a' $$, 'B não lê push_tokens de A');
select is_empty($$ select 1 from public.entitlements where user_id = '80000000-0000-4000-8000-00000000000a' $$, 'B não lê entitlements de A');
select is(public.owns_dog('80000000-0000-4000-8000-0000000000da'), false, 'owns_dog: B não é dono do cão de A');
select is(public.owns_dog('80000000-0000-4000-8000-0000000000db'), true, 'owns_dog: B é dono do próprio cão');

-- Escrita: nada de A muda.
select is(pg_temp.linhas($$ update public.dogs set name = 'Roubado' where id = '80000000-0000-4000-8000-0000000000da' $$), 0, 'B não altera o cão de A');
select is(pg_temp.linhas($$ update public.dogs set archived_at = now() where id = '80000000-0000-4000-8000-0000000000da' $$), 0, 'B não arquiva o cão de A');
select is(pg_temp.linhas($$ delete from public.dogs where id = '80000000-0000-4000-8000-0000000000da' $$), 0, 'B não apaga o cão de A');
select throws_ok($$ insert into public.dog_goals (dog_id, goal_code) values ('80000000-0000-4000-8000-0000000000da', 'guia') $$, '42501', null, 'B não cria objetivo no cão de A');
select is(pg_temp.linhas($$ update public.dog_goals set flagged_severe = true where dog_id = '80000000-0000-4000-8000-0000000000da' $$), 0, 'B não altera objetivo de A');
select is(pg_temp.linhas($$ delete from public.dog_goals where dog_id = '80000000-0000-4000-8000-0000000000da' $$), 0, 'B não apaga objetivo de A');
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result) values ('80000000-0000-4000-8000-0000000000da', '80000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', 'Isso não é seu.', 'B não registra sessão no cão de A'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result, dog_program_id) values ('80000000-0000-4000-8000-0000000000db', '80000000-0000-4000-8000-0000000000e1', 'conseguiu', '80000000-0000-4000-8000-0000000000aa') $$,
  '42501', 'Isso não é seu.', 'B não usa o programa do cão de A na própria sessão'
);
select is(pg_temp.linhas($$ delete from public.training_sessions where id = '80000000-0000-4000-8000-0000000005a1' $$), 0, 'B não desfaz sessão de A');
select throws_ok(
  $$ insert into public.challenge_entries (challenge_id, dog_id) values ('80000000-0000-4000-8000-0000000000c1', '80000000-0000-4000-8000-0000000000da') $$,
  '42501', null, 'B não inscreve o cão de A em desafio'
);
select is(pg_temp.linhas($$ delete from public.push_tokens where user_id = '80000000-0000-4000-8000-00000000000a' $$), 0, 'B não apaga token de A');
select throws_ok($$ select public.user_day('80000000-0000-4000-8000-00000000000a') $$, '42501', null, 'B não consulta o dia lógico de A');
select throws_ok($$ select public.is_premium('80000000-0000-4000-8000-00000000000a') $$, '42501', null, 'B não consulta o Premium de A');
select throws_ok(
  $$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('80000000-0000-4000-8000-00000000000a', 'Plantado', '2024-01-01', 'mini', 'alta', 5) $$,
  '42501', null, 'B não cria cão na conta de A'
);
reset role;

-- Conferência como postgres: tudo de A intacto.
select results_eq(
  $$ select name, archived_at is null from public.dogs where id = '80000000-0000-4000-8000-0000000000da' $$,
  $$ values ('Caramelo', true) $$, 'cão de A intacto'
);
select is((select count(*)::int from public.dog_goals where dog_id = '80000000-0000-4000-8000-0000000000da' and not flagged_severe), 1, 'objetivo de A intacto');
select is((select count(*)::int from public.training_sessions where dog_id = '80000000-0000-4000-8000-0000000000da'), 1, 'sessões de A intactas');
select is((select count(*)::int from public.push_tokens where user_id = '80000000-0000-4000-8000-00000000000a'), 1, 'token de A intacto');
select is((select count(*)::int from public.dogs where owner_id = '80000000-0000-4000-8000-00000000000a'), 1, 'A continua com um cão só');

select * from finish();
rollback;
