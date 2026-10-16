-- Fase 2 — conteúdo publicado, cadeado Premium (get_exercise, F16, F38), is_premium (F36),
-- entitlements, desafios, push_tokens e app_config.
begin;
create extension if not exists pgtap with schema extensions;

select plan(35);

insert into auth.users (id, email) values
  ('70000000-0000-4000-8000-000000000001', 'free@teste.local'),
  ('70000000-0000-4000-8000-000000000002', 'ativo@teste.local'),
  ('70000000-0000-4000-8000-000000000003', 'cancelado@teste.local'),
  ('70000000-0000-4000-8000-000000000004', 'expirado@teste.local'),
  ('70000000-0000-4000-8000-000000000005', 'vencido@teste.local'),
  ('70000000-0000-4000-8000-000000000006', 'cobranca@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id::text like '70000000-%';
insert into public.entitlements (user_id, status, expires_at) values
  ('70000000-0000-4000-8000-000000000002', 'ativo', now() + interval '30 days'),
  ('70000000-0000-4000-8000-000000000003', 'cancelado', now() + interval '5 days'),
  ('70000000-0000-4000-8000-000000000004', 'expirado', now() + interval '5 days'),
  ('70000000-0000-4000-8000-000000000005', 'ativo', now() - interval '1 minute'),
  ('70000000-0000-4000-8000-000000000006', 'cobranca_falhou', now() + interval '3 days');

insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('70000000-0000-4000-8000-0000000000d1', '70000000-0000-4000-8000-000000000001', 'Pipoca', '2020-01-01', 'pequeno', 'baixa', 5);

insert into public.exercises (id, slug, title, category, summary, steps, levels, tips, safety_note, video_url, duration_min, is_premium, published, reviewed_by) values
  ('70000000-0000-4000-8000-0000000000e1', 'c-senta', 'Senta', 'obediencia', 'Resumo grátis', '["passo"]', '[1,2,3,4]', '["dica"]', 'Cuidado', 'https://v.exemplo/senta.mp4', 3, false, true, 'teste'),
  ('70000000-0000-4000-8000-0000000000e2', 'c-pata', 'Dá a pata', 'truque', 'Resumo Premium', '["passo"]', '[1,2,3,4]', '["dica"]', 'Cuidado', 'https://v.exemplo/pata.mp4', 3, true, true, 'teste'),
  ('70000000-0000-4000-8000-0000000000e3', 'c-rascunho', 'Rascunho', 'truque', 'Resumo', '["passo"]', '[1,2,3,4]', '[]', null, null, 3, false, false, null);
insert into public.programs (id, slug, title, goal_code, weeks, is_premium, published, reviewed_by) values
  ('70000000-0000-4000-8000-0000000000f1', 'c-publicado', 'Publicado', 'truques', 1, false, true, 'teste'),
  ('70000000-0000-4000-8000-0000000000f2', 'c-rascunho', 'Rascunho', 'truques', 1, false, false, null);
insert into public.program_items (program_id, day_index, position, exercise_id, target_level) values
  ('70000000-0000-4000-8000-0000000000f1', 1, 1, '70000000-0000-4000-8000-0000000000e1', 1),
  ('70000000-0000-4000-8000-0000000000f2', 1, 1, '70000000-0000-4000-8000-0000000000e1', 1);
insert into public.challenges (id, month, title, exercise_id, is_premium, published, reviewed_by) values
  ('70000000-0000-4000-8000-0000000000c1', '2030-01-01', 'Mês do Senta', '70000000-0000-4000-8000-0000000000e1', false, true, 'teste'),
  ('70000000-0000-4000-8000-0000000000c2', '2030-02-01', 'Mês da Pata', '70000000-0000-4000-8000-0000000000e2', true, true, 'teste'),
  ('70000000-0000-4000-8000-0000000000c3', '2030-03-01', 'Rascunho', '70000000-0000-4000-8000-0000000000e1', false, false, null);
insert into public.app_config (key, value) values ('t_flag', 'true') on conflict do nothing;

-- is_premium (F36): só "expirado" ou a data vencida cortam o acesso.
select is(public.is_premium('70000000-0000-4000-8000-000000000001'), false, 'sem entitlement: grátis');
select is(public.is_premium('70000000-0000-4000-8000-000000000002'), true, 'ativo: Premium');
select is(public.is_premium('70000000-0000-4000-8000-000000000003'), true, 'cancelado: Premium até expires_at');
select is(public.is_premium('70000000-0000-4000-8000-000000000004'), false, 'expirado: grátis');
select is(public.is_premium('70000000-0000-4000-8000-000000000005'), false, 'expires_at vencido: grátis');
select is(public.is_premium('70000000-0000-4000-8000-000000000006'), true, 'cobranca_falhou: Premium na tolerância');

-- Grátis
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "70000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select is(public.is_premium('70000000-0000-4000-8000-000000000001'), false, 'usuário consulta o próprio is_premium');
select results_eq(
  $$ select title, summary, locked, video_url, steps, levels, tips, safety_note from public.get_exercise('c-pata') $$,
  $$ values ('Dá a pata', 'Resumo Premium', true, null::text, null::jsonb, null::jsonb, null::jsonb, null::text) $$,
  'get_exercise: Premium para grátis devolve só título, resumo e locked'
);
select results_eq(
  $$ select locked, video_url, steps from public.get_exercise('c-senta') $$,
  $$ values (false, 'https://v.exemplo/senta.mp4', '["passo"]'::jsonb) $$,
  'get_exercise: exercício grátis vem completo'
);
select is_empty($$ select * from public.get_exercise('c-rascunho') $$, 'get_exercise: não publicado não aparece');
select is_empty($$ select * from public.get_exercise('nao-existe') $$, 'get_exercise: slug inexistente não aparece');

select throws_ok($$ select video_url from public.exercises $$, '42501', null, 'grátis não lê video_url direto da tabela');
select throws_ok($$ select steps from public.exercises $$, '42501', null, 'grátis não lê steps direto da tabela');
select throws_ok($$ select * from public.exercises $$, '42501', null, 'select * em exercises é negado (colunas protegidas)');
select results_eq(
  $$ select slug from public.exercises where slug like 'c-%' order by slug $$,
  $$ values ('c-pata'), ('c-senta') $$,
  'lista de exercícios: só publicados, com colunas de listagem'
);
select results_eq(
  $$ select slug from public.programs where slug like 'c-%' $$,
  $$ values ('c-publicado') $$,
  'programas: só publicados'
);
select is(
  (select count(*)::int from public.program_items where program_id = '70000000-0000-4000-8000-0000000000f2'),
  0, 'itens de programa não publicado ficam ocultos'
);
select results_eq(
  $$ select title from public.challenges where month >= '2030-01-01' order by month $$,
  $$ values ('Mês do Senta'), ('Mês da Pata') $$,
  'desafios: só publicados'
);

select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min) values ('x', 'X', 'truque', 'R', '["a"]', '[1,2,3,4]', 3) $$,
  '42501', null, 'app não cria exercício');
select throws_ok($$ update public.programs set published = true $$, '42501', null, 'app não altera programa');
select throws_ok($$ delete from public.program_items $$, '42501', null, 'app não apaga itens de programa');
select throws_ok($$ insert into public.challenges (month, title, exercise_id) values ('2031-01-01', 'X', '70000000-0000-4000-8000-0000000000e1') $$,
  '42501', null, 'app não cria desafio');
select throws_ok($$ update public.app_config set value = 'false' $$, '42501', null, 'app não altera app_config');

-- entitlements: só leitura do próprio; escrita só service role.
select is_empty($$ select * from public.entitlements $$, 'grátis não vê entitlements de ninguém');
select throws_ok($$ insert into public.entitlements (user_id, status, expires_at) values ('70000000-0000-4000-8000-000000000001', 'ativo', now() + interval '1 year') $$,
  '42501', null, 'app não se dá Premium');

-- Desafios: participa do grátis publicado; Premium e não publicado são recusados.
select lives_ok(
  $$ insert into public.challenge_entries (challenge_id, dog_id) values ('70000000-0000-4000-8000-0000000000c1', '70000000-0000-4000-8000-0000000000d1') $$,
  'participa de desafio grátis publicado'
);
select throws_ok(
  $$ insert into public.challenge_entries (challenge_id, dog_id) values ('70000000-0000-4000-8000-0000000000c2', '70000000-0000-4000-8000-0000000000d1') $$,
  '42501', null, 'desafio Premium recusado para grátis'
);
select throws_ok(
  $$ insert into public.challenge_entries (challenge_id, dog_id) values ('70000000-0000-4000-8000-0000000000c3', '70000000-0000-4000-8000-0000000000d1') $$,
  '42501', null, 'desafio não publicado recusado'
);
select throws_ok(
  $$ insert into public.challenge_entries (challenge_id, dog_id, completed_at) values ('70000000-0000-4000-8000-0000000000c1', '70000000-0000-4000-8000-0000000000d1', now()) $$,
  '42501', null, 'completed_at não vem do app'
);

-- push_tokens: só do dono.
select lives_ok(
  $$ insert into public.push_tokens (token, platform) values ('ExponentPushToken[abc123]', 'android') $$,
  'registra o próprio token de push'
);
select throws_ok(
  $$ insert into public.push_tokens (user_id, token, platform) values ('70000000-0000-4000-8000-000000000002', 'ExponentPushToken[xyz]', 'ios') $$,
  '42501', null, 'não registra token em nome de outro'
);

-- Premium ativo
select set_config('request.jwt.claims', '{"sub": "70000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select results_eq(
  $$ select locked, video_url, steps from public.get_exercise('c-pata') $$,
  $$ values (false, 'https://v.exemplo/pata.mp4', '["passo"]'::jsonb) $$,
  'get_exercise: Premium vê o exercício Premium completo'
);
select results_eq(
  $$ select user_id, status from public.entitlements $$,
  $$ values ('70000000-0000-4000-8000-000000000002'::uuid, 'ativo') $$,
  'Premium lê só o próprio entitlement'
);
reset role;

-- anon
set local role anon;
select throws_ok($$ select * from public.get_exercise('c-senta') $$, '42501', null, 'anon não chama get_exercise');
select results_eq($$ select value from public.app_config where key = 't_flag' $$, $$ values ('true'::jsonb) $$, 'anon lê app_config (manutenção antes do login)');
reset role;

select * from finish();
rollback;
