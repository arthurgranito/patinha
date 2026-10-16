-- Fase 2 — dogs: limite de cães (F08 9e, F10, F12), 18+ e escrita só do dono.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email) values
  ('40000000-0000-4000-8000-000000000001', 'gratis@teste.local'),
  ('40000000-0000-4000-8000-000000000002', 'premium@teste.local'),
  ('40000000-0000-4000-8000-000000000003', 'menor@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id in ('40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002');
insert into public.entitlements (user_id, status, expires_at)
values ('40000000-0000-4000-8000-000000000002', 'ativo', now() + interval '30 days');

-- Grátis
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "40000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.dogs (id, name, birth_month, size, energy, daily_minutes) values ('40000000-0000-4000-8000-0000000000a1', 'Caramelo', '2026-06-01', 'medio', 'alta', 10) $$,
  'grátis cadastra o 1º cão (owner_id vem de auth.uid())'
);
select is(
  (select owner_id from public.dogs where id = '40000000-0000-4000-8000-0000000000a1'),
  '40000000-0000-4000-8000-000000000001'::uuid, 'owner_id preenchido com o usuário'
);
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes) values ('Paçoca', '2026-06-01', 'mini', 'alta', 5) $$,
  'PA001', 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.', 'grátis não cadastra o 2º cão'
);
select lives_ok(
  $$ update public.dogs set archived_at = now() where id = '40000000-0000-4000-8000-0000000000a1' $$,
  'arquivar o cão'
);
select lives_ok(
  $$ insert into public.dogs (id, name, birth_month, size, energy, daily_minutes) values ('40000000-0000-4000-8000-0000000000a2', 'Paçoca', '2026-06-01', 'mini', 'alta', 5) $$,
  'cão arquivado não conta no limite'
);
select throws_ok(
  $$ update public.dogs set archived_at = null where id = '40000000-0000-4000-8000-0000000000a1' $$,
  'PA001', 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.', 'reativar respeita o limite'
);
select throws_ok(
  $$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('40000000-0000-4000-8000-000000000002', 'Intruso', '2026-06-01', 'mini', 'alta', 5) $$,
  '42501', null, 'não cadastra cão em nome de outro usuário'
);
select throws_ok(
  $$ update public.dogs set owner_id = '40000000-0000-4000-8000-000000000002' where id = '40000000-0000-4000-8000-0000000000a2' $$,
  '42501', null, 'owner_id não muda'
);
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes, created_at) values ('X', '2026-06-01', 'mini', 'alta', 5, now()) $$,
  '42501', null, 'created_at não vem do app'
);

-- Premium: até 5 ativos
select set_config('request.jwt.claims', '{"sub": "40000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select lives_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes)
     select 'Cão ' || n, '2024-01-01', 'medio', 'media', 10 from generate_series(1, 5) n $$,
  'Premium cadastra 5 cães'
);
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes) values ('Sexto', '2024-01-01', 'medio', 'media', 10) $$,
  'PA002', 'Você chegou ao limite de 5 cães. Arquive um para adicionar outro.', 'Premium não cadastra o 6º cão'
);

-- Premium expirado volta ao limite do grátis para cães novos.
reset role;
update public.entitlements set status = 'expirado' where user_id = '40000000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes) values ('Sexto', '2024-01-01', 'medio', 'media', 10) $$,
  'PA001', 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.', 'Premium expirado volta ao limite do grátis'
);

-- Sem 18+ confirmado (pulou o onboarding chamando a API direto).
select set_config('request.jwt.claims', '{"sub": "40000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes) values ('Bob', '2024-01-01', 'medio', 'media', 10) $$,
  '42501', null, 'sem 18+ não cadastra cão'
);

reset role;
set local role anon;
select throws_ok(
  $$ insert into public.dogs (name, birth_month, size, energy, daily_minutes) values ('Bob', '2024-01-01', 'medio', 'media', 10) $$,
  '42501', null, 'anon não cadastra cão'
);
select throws_ok($$ select * from public.dogs $$, '42501', null, 'anon não lê cães');
reset role;

select * from finish();
rollback;
