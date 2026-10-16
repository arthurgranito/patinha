-- Fase 2 — training_sessions: dia lógico (ADR-05), só hoje/ontem, Premium, dono, 18+,
-- sem update e desfazer até 24 h (F19, F21, F31, F38).
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

create function pg_temp.linhas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- U1 grátis, U2 Premium, U3 sem 18+.
insert into auth.users (id, email) values
  ('50000000-0000-4000-8000-000000000001', 's1@teste.local'),
  ('50000000-0000-4000-8000-000000000002', 's2@teste.local'),
  ('50000000-0000-4000-8000-000000000003', 's3@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id in ('50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002');
insert into public.entitlements (user_id, status, expires_at)
values ('50000000-0000-4000-8000-000000000002', 'teste', now() + interval '7 days');

insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-000000000001', 'Caramelo', '2026-01-01', 'medio', 'alta', 10),
  ('50000000-0000-4000-8000-0000000000d2', '50000000-0000-4000-8000-000000000002', 'Thor', '2022-01-01', 'grande', 'media', 15),
  ('50000000-0000-4000-8000-0000000000d3', '50000000-0000-4000-8000-000000000003', 'Bob', '2022-01-01', 'mini', 'media', 5);

insert into public.exercises (id, slug, title, category, summary, steps, levels, duration_min, is_premium, published, reviewed_by) values
  ('50000000-0000-4000-8000-0000000000e1', 't-senta', 'Senta', 'obediencia', 'Resumo', '["a"]', '[1,2,3,4]', 3, false, true, 'teste'),
  ('50000000-0000-4000-8000-0000000000e2', 't-pata', 'Pata', 'truque', 'Resumo', '["a"]', '[1,2,3,4]', 3, true, true, 'teste'),
  ('50000000-0000-4000-8000-0000000000e3', 't-rascunho', 'Rascunho', 'truque', 'Resumo', '["a"]', '[1,2,3,4]', 3, false, false, null);

-- Dia lógico (ADR-05): fuso America/Sao_Paulo, virada às 4h.
select is(public.user_day('50000000-0000-4000-8000-000000000001', '2026-03-10 00:30:00-03'), '2026-03-09'::date,
  'user_day: 00:30 cai no dia anterior');
select is(public.user_day('50000000-0000-4000-8000-000000000001', '2026-03-10 03:59:00-03'), '2026-03-09'::date,
  'user_day: 03:59 ainda é o dia anterior');
select is(public.user_day('50000000-0000-4000-8000-000000000001', '2026-03-10 04:00:00-03'), '2026-03-10'::date,
  'user_day: 04:00 já é o dia novo');
update public.profiles set timezone = 'America/Manaus', day_cutoff_hour = 0 where id = '50000000-0000-4000-8000-000000000002';
select is(public.user_day('50000000-0000-4000-8000-000000000002', '2026-03-10 00:30:00-03'), '2026-03-09'::date,
  'user_day respeita o fuso do tutor (Manaus, 23:30 local)');
update public.profiles set timezone = 'America/Sao_Paulo', day_cutoff_hour = 4 where id = '50000000-0000-4000-8000-000000000002';

select ok(
  not (select prosecdef from pg_proc where oid = 'public.training_sessions_before_insert()'::regprocedure),
  'trigger BEFORE roda como quem insere (security invoker)'
);

-- Como U1 (grátis)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.training_sessions (id, dog_id, exercise_id, result, level)
     values ('50000000-0000-4000-8000-000000000a01', '50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'conseguiu', 4) $$,
  'U1 registra uma sessão agora'
);
select results_eq(
  $$ select user_id, done_on, level, created_at = now() from public.training_sessions where id = '50000000-0000-4000-8000-000000000a01' $$,
  $$ values ('50000000-0000-4000-8000-000000000001'::uuid, public.user_day('50000000-0000-4000-8000-000000000001'), 1, true) $$,
  'banco preenche user_id, done_on (dia lógico), o nível atual (ignora o do app) e created_at'
);

-- 00:30 do dia lógico de hoje (no calendário) pertence a ontem e está sempre no passado.
select lives_ok(
  $$ insert into public.training_sessions (id, dog_id, exercise_id, result, done_at, source)
     values ('50000000-0000-4000-8000-000000000a02', '50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'quase',
             (public.user_day('50000000-0000-4000-8000-000000000001') + time '00:30') at time zone 'America/Sao_Paulo', 'offline') $$,
  'sessão feita às 00:30 é aceita'
);
select is(
  (select done_on from public.training_sessions where id = '50000000-0000-4000-8000-000000000a02'),
  public.user_day('50000000-0000-4000-8000-000000000001') - 1,
  'sessão às 00:30 cai no dia lógico anterior'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'conseguiu', now() - interval '3 days') $$,
  'PA004', 'Um treino não pôde ser salvo porque passou do prazo (só hoje ou ontem).', 'sessão de anteontem é recusada'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'conseguiu', now() + interval '1 hour') $$,
  '22023', null, 'sessão no futuro é recusada'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e2', 'conseguiu') $$,
  'PA003', 'Esse exercício é do Premium.', 'exercício Premium sem assinatura é recusado'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e3', 'conseguiu') $$,
  'P0002', null, 'exercício não publicado é recusado'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d2', '50000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', 'Isso não é seu.', 'sessão no cão de outro tutor é recusada'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, user_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', 'Isso não é seu.', 'user_id de outro usuário é recusado'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result, done_on)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'conseguiu', current_date - 10) $$,
  '42501', null, 'done_on não vem do app'
);
select throws_ok(
  $$ update public.training_sessions set result = 'conseguiu' where id = '50000000-0000-4000-8000-000000000a02' $$,
  '42501', null, 'sessão não tem update'
);

-- Desfazer: até 24 h depois de o banco receber (created_at), mesmo com done_at de ontem.
select is(
  pg_temp.linhas($$ delete from public.training_sessions where id = '50000000-0000-4000-8000-000000000a02' $$),
  1, 'desfaz sessão de ontem recebida agora (fila offline)'
);
reset role;
update public.training_sessions set created_at = now() - interval '25 hours' where id = '50000000-0000-4000-8000-000000000a01';
set local role authenticated;
select is(
  pg_temp.linhas($$ delete from public.training_sessions where id = '50000000-0000-4000-8000-000000000a01' $$),
  0, 'não desfaz sessão recebida há mais de 24 h'
);

-- U2 (Premium em teste) treina o exercício Premium e não apaga sessão alheia.
reset role;
update public.training_sessions set created_at = now() where id = '50000000-0000-4000-8000-000000000a01';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d2', '50000000-0000-4000-8000-0000000000e2', 'conseguiu') $$,
  'Premium registra sessão de exercício Premium'
);
select is(
  pg_temp.linhas($$ delete from public.training_sessions where id = '50000000-0000-4000-8000-000000000a01' $$),
  0, 'U2 não desfaz a sessão de U1'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-0000000000d2', '50000000-0000-4000-8000-0000000000e1', 'conseguiu', now() - interval '10 days') $$,
  'PA004', null, 'usuário comum nunca pula a janela de hoje/ontem'
);

-- U3 sem 18+
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d3', '50000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', null, 'sem 18+ não registra sessão'
);
reset role;

-- anon
set local role anon;
select throws_ok(
  $$ insert into public.training_sessions (dog_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', null, 'anon não tem insert em training_sessions'
);
reset role;

-- Papel de serviço (seed, Studio, service role): grava sessões antigas, ainda com dia lógico e dono.
select set_config('request.jwt.claims', '', true);
select lives_ok(
  $$ insert into public.training_sessions (id, dog_id, user_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-000000000a03', '50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-000000000001',
             '50000000-0000-4000-8000-0000000000e1', 'conseguiu', '2026-03-10 00:30:00-03') $$,
  'postgres grava sessão antiga (seed)'
);
select is(
  (select done_on from public.training_sessions where id = '50000000-0000-4000-8000-000000000a03'),
  '2026-03-09'::date, 'sessão antiga do seed também usa o dia lógico'
);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, user_id, exercise_id, result)
     values ('50000000-0000-4000-8000-0000000000d2', '50000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-0000000000e1', 'conseguiu') $$,
  '42501', 'Isso não é seu.', 'nem o papel de serviço grava sessão com dono errado'
);

set local role service_role;
select set_config('request.jwt.claims', '{"role": "service_role"}', true);
select lives_ok(
  $$ insert into public.training_sessions (dog_id, user_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-000000000001',
             '50000000-0000-4000-8000-0000000000e1', 'quase', now() - interval '10 days') $$,
  'service_role grava sessão antiga'
);
reset role;

-- authenticated sem sub (sem papel de serviço) não é tratado como serviço.
set local role authenticated;
select set_config('request.jwt.claims', '{"role": "authenticated"}', true);
select throws_ok(
  $$ insert into public.training_sessions (dog_id, user_id, exercise_id, result, done_at)
     values ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-000000000001',
             '50000000-0000-4000-8000-0000000000e1', 'quase', now() - interval '10 days') $$,
  '42501', null, 'sem sub e sem papel de serviço, a janela não é pulada'
);
reset role;

-- user_day e is_premium: usuário só consulta o próprio.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select throws_ok($$ select public.user_day('50000000-0000-4000-8000-000000000002') $$, '42501', null, 'user_day de outro usuário é recusado');
select throws_ok($$ select public.is_premium('50000000-0000-4000-8000-000000000002') $$, '42501', null, 'is_premium de outro usuário é recusado');
reset role;

select * from finish();
rollback;
