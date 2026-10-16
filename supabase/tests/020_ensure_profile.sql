-- Fase 1 — ensure_profile(): cria só o perfil do próprio usuário, é idempotente e anon não executa.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ana@exemplo.com', '{"full_name": "Ana Souza"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bruno@exemplo.com', '{}');

-- Simula o bug: usuário válido sem perfil (Ana) e outro também sem perfil (Bruno).
delete from public.profiles where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

select ok(not has_function_privilege('anon', 'public.ensure_profile()', 'execute'), 'anon não executa ensure_profile');
select ok(has_function_privilege('authenticated', 'public.ensure_profile()', 'execute'), 'authenticated executa ensure_profile');
select ok(not has_function_privilege('authenticated', 'public.default_display_name(jsonb, text)', 'execute'), 'authenticated não executa default_display_name');
select is(
  (select proconfig from pg_proc where oid = 'public.ensure_profile()'::regprocedure),
  array['search_path=""'], 'ensure_profile tem search_path vazio'
);
select ok(
  (select prosecdef from pg_proc where oid = 'public.ensure_profile()'::regprocedure),
  'ensure_profile é security definer'
);

set local role anon;
select throws_ok($$ select public.ensure_profile() $$, '42501', null, 'anon não chama ensure_profile');
reset role;

-- Como a Ana
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "role": "authenticated"}', true);

select results_eq(
  $$ select id, display_name, is_adult_confirmed from public.ensure_profile() $$,
  $$ values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Ana Souza', false) $$,
  'cria o perfil que faltava, com o nome do provedor e sem maioridade'
);
update public.profiles set display_name = 'Ana' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select lives_ok($$ select public.ensure_profile() $$, '2ª chamada não falha');
select is(
  (select display_name from public.ensure_profile()),
  'Ana', 'idempotente: não sobrescreve o perfil existente'
);

reset role;
select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1, 'continua uma linha só para a Ana'
);
select is(
  (select count(*)::int from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0, 'a chamada da Ana não criou o perfil do Bruno'
);

-- Usuário apagado do Auth com token ainda válido: não ganha perfil novo.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "role": "authenticated"}', true);
select throws_ok($$ select public.ensure_profile() $$, 'P0002', null, 'usuário inexistente no Auth recebe erro');
reset role;
select is(
  (select count(*)::int from public.profiles where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  0, 'nenhum perfil criado para usuário inexistente'
);

-- O trigger continua usando o mesmo nome padrão.
insert into auth.users (id, email, raw_user_meta_data) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'carla@exemplo.com', '{}');
select is(
  (select display_name from public.profiles where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'carla', 'trigger usa default_display_name'
);

select * from finish();
rollback;
