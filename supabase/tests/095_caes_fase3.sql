-- Fase 3 — create_dog/save_dog_goals (F08, F09), cão ativo (F08 passo 9, F11, F12),
-- "O cão partiu 🌈" e as regras novas de dogs.
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

insert into auth.users (id, email) values
  ('95000000-0000-4000-8000-000000000001', 'gratis@teste.local'),
  ('95000000-0000-4000-8000-000000000002', 'premium@teste.local'),
  ('95000000-0000-4000-8000-000000000003', 'menor@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id in ('95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000002');
insert into public.entitlements (user_id, status, expires_at)
values ('95000000-0000-4000-8000-000000000002', 'ativo', now() + interval '30 days');

create function pg_temp.ativo(p_user uuid) returns uuid language sql as $$
  select active_dog_id from public.profiles where id = p_user;
$$;
grant execute on function pg_temp.ativo(uuid) to authenticated;

-- Privilégios
select ok(has_function_privilege('authenticated', 'public.create_dog(text, date, text, text, boolean, text, int, jsonb)', 'execute'), 'authenticated executa create_dog');
select ok(not has_function_privilege('anon', 'public.create_dog(text, date, text, text, boolean, text, int, jsonb)', 'execute'), 'anon não executa create_dog');
select ok(not has_function_privilege('anon', 'public.save_dog_goals(uuid, jsonb)', 'execute'), 'anon não executa save_dog_goals');
select ok(not has_function_privilege('authenticated', 'public.reassign_active_dog(uuid, uuid)', 'execute'), 'authenticated não executa reassign_active_dog');
select ok(not has_function_privilege('authenticated', 'public.dogs_keep_active()', 'execute'), 'authenticated não executa dogs_keep_active');
select ok(not has_column_privilege('authenticated', 'public.dogs', 'passed_away_at', 'insert'), 'passed_away_at não vem no insert');

-- Grátis: cadastro completo
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "95000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

create temp table caes (nome text primary key, id uuid) on commit drop;
grant all on caes to authenticated;

insert into caes
select 'Caramelo', (public.create_dog('Caramelo', '2026-01-01', 'medio', null, true, 'alta', 10,
  '[{"goal_code": "mordida", "flagged_severe": true}, {"goal_code": "xixi"}]')).id;

select is(
  (select owner_id from public.dogs where id = (select id from caes where nome = 'Caramelo')),
  '95000000-0000-4000-8000-000000000001'::uuid, 'create_dog grava o cão do próprio tutor'
);
select results_eq(
  $$ select goal_code, flagged_severe from public.dog_goals where dog_id = (select id from caes where nome = 'Caramelo') order by goal_code $$,
  $$ values ('mordida', true), ('xixi', false) $$,
  'create_dog grava os objetivos com a triagem (ADR-07)'
);
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000001'), (select id from caes where nome = 'Caramelo'), 'o 1º cão vira o ativo');

select throws_ok(
  $$ select public.create_dog('Paçoca', '2026-01-01', 'mini', null, true, 'alta', 5, '[{"goal_code": "truques"}]') $$,
  'PA001', 'No plano grátis você cadastra 1 cão. Com o Premium, até 5.', 'grátis não cadastra o 2º cão pela RPC'
);
select is((select count(*)::int from public.dogs), 1, 'nada fica pela metade quando o limite barra');

select lives_ok(
  $$ select public.save_dog_goals((select id from caes where nome = 'Caramelo'), '[{"goal_code": "mordida", "flagged_severe": false}, {"goal_code": "guia"}]') $$,
  'save_dog_goals troca os objetivos'
);
select results_eq(
  $$ select goal_code, flagged_severe from public.dog_goals where dog_id = (select id from caes where nome = 'Caramelo') order by goal_code $$,
  $$ values ('guia', false), ('mordida', false) $$,
  'save_dog_goals remove o que saiu, atualiza a triagem e inclui o novo'
);
select throws_ok(
  $$ select public.save_dog_goals((select id from caes where nome = 'Caramelo'), '{"goal_code": "guia"}') $$,
  '22023', null, 'save_dog_goals exige uma lista'
);

select throws_ok(
  $$ select public.create_dog('Futuro', (date_trunc('month', now()) + interval '1 month')::date, 'mini', null, true, 'alta', 5, '[]') $$,
  '23514', 'Escolha um mês que já passou.', 'mês de nascimento no futuro é recusado'
);
select throws_ok(
  $$ update public.dogs set breed = 'Labrador' where id = (select id from caes where nome = 'Caramelo') $$,
  '23514', null, 'vira-lata não tem raça'
);
select throws_ok(
  $$ update public.dogs set photo_path = '95000000-0000-4000-8000-000000000001/outra.jpg' where id = (select id from caes where nome = 'Caramelo') $$,
  '23514', null, 'photo_path só pode ser <owner_id>/<id>.jpg'
);

-- Premium: troca, arquivar, reativar e excluir o ativo
select set_config('request.jwt.claims', '{"sub": "95000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
insert into caes select 'Thor', (public.create_dog('Thor', '2020-01-01', 'grande', 'Labrador', false, 'media', 15, '[]')).id;
insert into caes select 'Pipoca', (public.create_dog('Pipoca', '2015-01-01', 'pequeno', 'Shih-tzu', false, 'baixa', 5, '[]')).id;
insert into caes select 'Bidu', (public.create_dog('Bidu', '2022-01-01', 'medio', null, true, 'media', 10, '[]')).id;
-- Na mesma transação now() não anda: dá idades diferentes aos cadastros.
reset role;
update public.dogs set created_at = now() - interval '3 days' where id = (select id from caes where nome = 'Thor');
update public.dogs set created_at = now() - interval '2 days' where id = (select id from caes where nome = 'Pipoca');
update public.dogs set created_at = now() - interval '1 day' where id = (select id from caes where nome = 'Bidu');
set local role authenticated;

select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), (select id from caes where nome = 'Thor'), 'cães seguintes não tomam o lugar do ativo');

select throws_ok(
  $$ select public.save_dog_goals((select id from caes where nome = 'Caramelo'), '[{"goal_code": "guia"}]') $$,
  '42501', 'Isso não é seu.', 'save_dog_goals recusa o cão de outro tutor'
);

update public.profiles set active_dog_id = (select id from caes where nome = 'Pipoca') where id = '95000000-0000-4000-8000-000000000002';
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), (select id from caes where nome = 'Pipoca'), 'F11: tutor troca o cão ativo');

update public.dogs set archived_at = now() where id = (select id from caes where nome = 'Pipoca');
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), (select id from caes where nome = 'Thor'), 'arquivar o ativo passa o posto para o cão mais antigo');

delete from public.dogs where id = (select id from caes where nome = 'Thor');
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), (select id from caes where nome = 'Bidu'), 'excluir o ativo passa o posto para outro cão');

-- O cão partiu 🌈
update public.dogs set passed_away_at = '2000-01-01' where id = (select id from caes where nome = 'Bidu');
select ok(
  (select archived_at is not null and passed_away_at > now() - interval '1 minute' from public.dogs where id = (select id from caes where nome = 'Bidu')),
  'partiu arquiva junto, com a hora do banco'
);
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), null, 'sem cão ativo, active_dog_id fica nulo (o app vai para o F08)');
select throws_ok(
  $$ update public.dogs set archived_at = null where id = (select id from caes where nome = 'Bidu') $$,
  'PA005', 'Bidu está guardado com carinho e não pode ser reativado.', 'quem partiu não é reativado'
);
select throws_ok(
  $$ update public.dogs set passed_away_at = null where id = (select id from caes where nome = 'Bidu') $$,
  'PA005', null, 'partiu não se desfaz'
);

update public.dogs set archived_at = null where id = (select id from caes where nome = 'Pipoca');
select is(pg_temp.ativo('95000000-0000-4000-8000-000000000002'), (select id from caes where nome = 'Pipoca'), 'reativar sem ativo faz o cão virar o ativo');

-- Sem 18+
select set_config('request.jwt.claims', '{"sub": "95000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ select public.create_dog('Rex', '2020-01-01', 'mini', null, true, 'alta', 5, '[]') $$,
  '42501', null, 'sem 18+ não cadastra cão'
);
reset role;

-- Apagar a conta com cães não esbarra nos triggers do cão ativo.
select lives_ok(
  $$ delete from auth.users where id = '95000000-0000-4000-8000-000000000002' $$,
  'apagar o usuário apaga os cães em cascata'
);
select is((select count(*)::int from public.dogs where owner_id = '95000000-0000-4000-8000-000000000002'), 0, 'nenhum cão sobra');

-- Seed: o cão ativo do seed continua o mesmo com o trigger.
select ok(
  not exists (select 1 from public.profiles p where p.active_dog_id is null
               and exists (select 1 from public.dogs d where d.owner_id = p.id and d.archived_at is null)),
  'quem tem cão ativo tem active_dog_id'
);

select * from finish();
rollback;
