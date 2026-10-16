-- Fase 2 — tabelas, checks de domínio, índices e cascade.
begin;
create extension if not exists pgtap with schema extensions;

select plan(43);

select has_table('public', t, 'tabela ' || t || ' existe')
  from unnest(array[
    'dogs', 'dog_goals', 'programs', 'exercises', 'program_items', 'dog_programs', 'training_sessions',
    'dog_skills', 'dog_days', 'streak_freezes', 'dog_achievements', 'challenges', 'challenge_entries',
    'push_tokens', 'entitlements', 'app_config'
  ]) as t;

select has_index('public', 'training_sessions', 'training_sessions_dog_dia_idx', array['dog_id', 'done_on'], 'índice (dog_id, done_on)');
select has_index('public', 'training_sessions', 'training_sessions_dog_exercicio_idx', array['dog_id', 'exercise_id', 'done_at'], 'índice (dog_id, exercise_id, done_at desc)');
select has_index('public', 'dogs', 'dogs_owner_ativos_idx', array['owner_id'], 'índice parcial de cães ativos por dono');
select col_is_pk('public', 'program_items', array['program_id', 'day_index', 'position'], 'PK (program_id, day_index, position) cobre (program_id, day_index)');

insert into auth.users (id, email) values ('30000000-0000-4000-8000-000000000001', 'e1@teste.local');
-- Premium, para o limite de cães não mascarar os checks.
insert into public.entitlements (user_id, status, expires_at)
values ('30000000-0000-4000-8000-000000000001', 'ativo', now() + interval '1 day');
insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes)
values ('30000000-0000-4000-8000-0000000000d1', '30000000-0000-4000-8000-000000000001', 'Nina', '2023-02-01', 'pequeno', 'media', 10);

-- dogs
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', 'X', '2023-02-01', 'pequeno', 'media', 7) $$,
  '23514', null, 'daily_minutes fora de 5/10/15 é recusado');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', 'X', '2023-02-01', 'enorme', 'media', 5) $$,
  '23514', null, 'porte inválido é recusado');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', 'X', '2023-02-01', 'mini', 'furacao', 5) $$,
  '23514', null, 'energia inválida é recusada');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', ' ', '2023-02-01', 'mini', 'alta', 5) $$,
  '23514', null, 'nome em branco é recusado');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', repeat('a', 31), '2023-02-01', 'mini', 'alta', 5) $$,
  '23514', null, 'nome com 31 caracteres é recusado');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', 'Ca' || chr(8238) || 'ra', '2023-02-01', 'mini', 'alta', 5) $$,
  '23514', null, 'nome com caractere de direção é recusado');
select throws_ok($$ insert into public.dogs (owner_id, name, birth_month, size, energy, daily_minutes) values ('30000000-0000-4000-8000-000000000001', 'X', '2023-02-15', 'mini', 'alta', 5) $$,
  '23514', null, 'birth_month precisa ser dia 1');
select throws_ok($$ update public.dogs set photo_path = '99999999-0000-4000-8000-000000000001/foto.jpg' where id = '30000000-0000-4000-8000-0000000000d1' $$,
  '23514', null, 'foto fora da pasta do dono é recusada');
select throws_ok($$ update public.dogs set photo_path = '30000000-0000-4000-8000-000000000001/../x.jpg' where id = '30000000-0000-4000-8000-0000000000d1' $$,
  '23514', null, 'foto com .. é recusada');
select lives_ok($$ update public.dogs set photo_path = '30000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-0000000000d1.jpg' where id = '30000000-0000-4000-8000-0000000000d1' $$,
  'foto na pasta do dono é aceita');
select throws_ok($$ insert into public.dog_goals (dog_id, goal_code) values ('30000000-0000-4000-8000-0000000000d1', 'cavar') $$,
  '23514', null, 'objetivo inválido é recusado');

-- conteúdo
select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min) values ('x', 'X', 'magica', 'Resumo', '["a"]', '[1,2,3,4]', 3) $$,
  '23514', null, 'categoria inválida é recusada');
select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min) values ('x', 'X', 'truque', 'Resumo', '["a"]', '[1,2,3]', 3) $$,
  '23514', null, 'exercício sem 4 níveis é recusado');
select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min) values ('x', 'X', 'truque', 'Resumo', '{"a": 1}', '[1,2,3,4]', 3) $$,
  '23514', null, 'steps que não é lista é recusado');
select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min, published) values ('x', 'X', 'truque', 'Resumo', '["a"]', '[1,2,3,4]', 3, true) $$,
  '23514', null, 'exercício publicado sem reviewed_by é recusado');
select throws_ok($$ insert into public.exercises (slug, title, category, summary, steps, levels, duration_min) values ('X Y', 'X', 'truque', 'Resumo', '["a"]', '[1,2,3,4]', 3) $$,
  '23514', null, 'slug fora do formato é recusado');
select throws_ok($$ insert into public.programs (slug, title, goal_code, weeks, published) values ('p', 'P', 'guia', 2, true) $$,
  '23514', null, 'programa publicado sem reviewed_by é recusado');
select throws_ok($$ insert into public.challenges (month, title, exercise_id) select '2027-03-02', 'X', id from public.exercises limit 1 $$,
  '23514', null, 'desafio precisa começar no dia 1');

-- derivadas e conta
select throws_ok($$ insert into public.dog_skills (dog_id, exercise_id, level) select '30000000-0000-4000-8000-0000000000d1', id, 5 from public.exercises limit 1 $$,
  '23514', null, 'nível acima de 4 é recusado');
select throws_ok($$ insert into public.dog_days (dog_id, day, status) values ('30000000-0000-4000-8000-0000000000d1', current_date, 'faltou') $$,
  '23514', null, 'status de dia inválido é recusado');
select throws_ok($$ update public.entitlements set status = 'vitalicio' where user_id = '30000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'status de assinatura inválido é recusado');
select throws_ok($$ insert into public.push_tokens (user_id, token, platform) values ('30000000-0000-4000-8000-000000000001', 'abc', 'ios') $$,
  '23514', null, 'token de push fora do formato Expo é recusado');

-- Apagar o usuário no Auth apaga tudo dele em cascata.
delete from auth.users where id = '30000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.dogs where id = '30000000-0000-4000-8000-0000000000d1'), 0, 'cão apagado em cascata com o usuário');

select * from finish();
rollback;
