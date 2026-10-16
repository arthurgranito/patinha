-- Fase 2 — lacunas da revisão de segurança da Fase 1 em profiles, e active_dog_id (FK + dono).
begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- Conta as linhas afetadas por um comando (para conferir que a RLS barrou sem erro).
create function pg_temp.linhas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('15000000-0000-4000-8000-000000000001', 'p1@teste.local', '{"full_name": "Pri"}'),
  ('15000000-0000-4000-8000-000000000002', 'p2@teste.local', '{"full_name": "Quim"}');

insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('15000000-0000-4000-8000-0000000000d1', '15000000-0000-4000-8000-000000000001', 'Bolinha', '2024-01-01', 'mini', 'alta', 5),
  ('15000000-0000-4000-8000-0000000000d2', '15000000-0000-4000-8000-000000000002', 'Rex', '2020-05-01', 'grande', 'baixa', 10);

-- Privilégios
select ok(not has_any_column_privilege('anon', 'public.profiles', 'update'), 'anon não tem update em nenhuma coluna de profiles');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'update'), 'authenticated não altera id');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'update'), 'authenticated não altera created_at');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'), 'authenticated não executa handle_new_user');
select ok(not has_function_privilege('authenticated', 'public.profiles_validate_timezone()', 'execute'), 'authenticated não executa profiles_validate_timezone');
select ok(not has_function_privilege('authenticated', 'public.profiles_validate_active_dog()', 'execute'), 'authenticated não executa profiles_validate_active_dog');
select is(
  (select proconfig from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  array['search_path=""'], 'handle_new_user tem search_path vazio'
);
select ok(
  (select prosecdef from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  'handle_new_user é security definer'
);

-- Como a Pri
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "15000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select is(
  pg_temp.linhas($$ update public.profiles set display_name = 'Invasora' where id = '15000000-0000-4000-8000-000000000002' $$),
  0, 'update no perfil de outro não afeta nenhuma linha'
);
select throws_ok(
  $$ update public.profiles set created_at = now() where id = '15000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Pri não altera created_at'
);
select throws_ok(
  $$ update public.profiles set id = '15000000-0000-4000-8000-000000000009' where id = '15000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'Pri não altera id'
);
-- F11 (Fase 3): o app troca o cão ativo.
select lives_ok(
  $$ update public.profiles set active_dog_id = '15000000-0000-4000-8000-0000000000d1' where id = '15000000-0000-4000-8000-000000000001' $$,
  'Pri escolhe o próprio cão como ativo'
);

reset role;

-- Sem login: anon não altera perfis.
set local role anon;
select throws_ok(
  $$ update public.profiles set display_name = 'X' $$,
  '42501', null, 'anon não faz update em profiles'
);
reset role;

-- active_dog_id: o cão precisa ser do próprio tutor e estar ativo; FK com on delete set null.
select lives_ok(
  $$ update public.profiles set active_dog_id = '15000000-0000-4000-8000-0000000000d1' where id = '15000000-0000-4000-8000-000000000001' $$,
  'active_dog_id aceita o próprio cão'
);
select throws_ok(
  $$ update public.profiles set active_dog_id = '15000000-0000-4000-8000-0000000000d2' where id = '15000000-0000-4000-8000-000000000001' $$,
  '42501', 'Isso não é seu.', 'active_dog_id recusa o cão de outro tutor'
);
update public.dogs set archived_at = now() where id = '15000000-0000-4000-8000-0000000000d2';
select throws_ok(
  $$ update public.profiles set active_dog_id = '15000000-0000-4000-8000-0000000000d2' where id = '15000000-0000-4000-8000-000000000002' $$,
  '42501', 'Isso não é seu.', 'active_dog_id recusa cão arquivado'
);
delete from public.dogs where id = '15000000-0000-4000-8000-0000000000d1';
select is(
  (select active_dog_id from public.profiles where id = '15000000-0000-4000-8000-000000000001'),
  null, 'apagar o cão ativo deixa active_dog_id nulo (on delete set null)'
);

select * from finish();
rollback;
