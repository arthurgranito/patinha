-- Fase 1 — profiles: trigger, RLS, grant por coluna, fuso e confirm_adult().
begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- Usuários de teste (o trigger cria os perfis).
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@exemplo.com', '{"full_name": "Ana Souza"}'),
  ('22222222-2222-2222-2222-222222222222', 'bruno@exemplo.com', '{"name": "Bruno"}'),
  ('33333333-3333-3333-3333-333333333333', 'carla.lima@exemplo.com', '{}'),
  ('44444444-4444-4444-4444-444444444444', null, '{}'),
  ('55555555-5555-5555-5555-555555555555', 'x@exemplo.com',
   jsonb_build_object('full_name', repeat('a', 39) || ' ' || repeat('b', 10)));

-- Trigger em auth.users
select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Ana Souza', 'trigger usa full_name do provedor'
);
select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'Bruno', 'trigger usa name quando não há full_name'
);
select is(
  (select display_name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'carla.lima', 'sem nome nos metadados: usa a parte local do e-mail'
);
select is(
  (select display_name from public.profiles where id = '44444444-4444-4444-4444-444444444444'),
  'Tutor', 'sem nome e sem e-mail: usa "Tutor"'
);
select is(
  (select display_name from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  repeat('a', 39), 'nome longo é cortado em 40 e sem espaço sobrando'
);
select results_eq(
  $$ select is_adult_confirmed, adult_confirmed_at is null, timezone, day_cutoff_hour, reminder_hour
       from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values (false, true, 'America/Sao_Paulo', 4, 19) $$,
  'perfil nasce sem maioridade confirmada e com os padrões'
);

-- Privilégios
select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon não lê profiles');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'insert'), 'authenticated não insere');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'delete'), 'authenticated não apaga');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'), 'update em display_name liberado');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'is_adult_confirmed', 'update'), 'update em is_adult_confirmed negado');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'adult_confirmed_at', 'update'), 'update em adult_confirmed_at negado');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'active_dog_id', 'update'), 'update em active_dog_id negado');
select ok(not has_function_privilege('anon', 'public.confirm_adult()', 'execute'), 'anon não executa confirm_adult');
select ok(has_function_privilege('authenticated', 'public.confirm_adult()', 'execute'), 'authenticated executa confirm_adult');
select is(
  (select proconfig from pg_proc where oid = 'public.confirm_adult()'::regprocedure),
  array['search_path=""'], 'confirm_adult tem search_path vazio'
);

-- Como a Ana (authenticated)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'Ana só enxerga o próprio perfil'
);

update public.profiles set display_name = 'Invasora' where id = '22222222-2222-2222-2222-222222222222';
select lives_ok(
  $$ update public.profiles set display_name = 'Ana', timezone = 'America/Manaus', day_cutoff_hour = 3, reminder_hour = 8
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'Ana altera as próprias preferências'
);
select throws_ok(
  $$ update public.profiles set is_adult_confirmed = true where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'Ana não altera is_adult_confirmed direto'
);
select throws_ok(
  $$ insert into public.profiles (id, display_name) values ('66666666-6666-6666-6666-666666666666', 'X') $$,
  '42501', null, 'Ana não insere perfis'
);
select throws_ok(
  $$ update public.profiles set display_name = '' where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'nome vazio é recusado'
);
select throws_ok(
  $$ update public.profiles set display_name = repeat('a', 41) where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'nome com 41 caracteres é recusado'
);
select throws_ok(
  $$ update public.profiles set day_cutoff_hour = 7 where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'virada do dia fora de 0-6 é recusada'
);
select throws_ok(
  $$ update public.profiles set reminder_hour = 24 where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null, 'lembrete fora de 0-23 é recusado'
);
select throws_ok(
  $$ update public.profiles set timezone = 'Marte/Olympus' where id = '11111111-1111-1111-1111-111111111111' $$,
  '22023', null, 'fuso inexistente é recusado pelo trigger'
);

select lives_ok($$ select public.confirm_adult() $$, 'Ana confirma a maioridade');
select lives_ok($$ select public.confirm_adult() $$, 'confirm_adult é idempotente');

reset role;

select results_eq(
  $$ select display_name, timezone, day_cutoff_hour, reminder_hour, is_adult_confirmed, adult_confirmed_at is not null
       from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Ana', 'America/Manaus', 3, 8, true, true) $$,
  'perfil da Ana ficou com as preferências e a maioridade confirmada'
);
select results_eq(
  $$ select display_name, is_adult_confirmed from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('Bruno', false) $$,
  'perfil do Bruno ficou intacto (nem nome nem maioridade)'
);

-- Sem login: anon não chama confirm_adult.
set local role anon;
select throws_ok($$ select public.confirm_adult() $$, '42501', null, 'anon não chama confirm_adult');
reset role;

select * from finish();
rollback;
