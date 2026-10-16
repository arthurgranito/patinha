-- Fase 3 — Storage dog-photos (F08 passo 2): bucket privado, cada tutor só na própria pasta,
-- foto só como <dog_id>.jpg de um cão dele, escrita com 18+.
begin;
create extension if not exists pgtap with schema extensions;

select plan(18);

create function pg_temp.linhas(p_sql text) returns int language plpgsql as $$
declare n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

insert into auth.users (id, email) values
  ('90000000-0000-4000-8000-000000000001', 'ana@teste.local'),
  ('90000000-0000-4000-8000-000000000002', 'beto@teste.local'),
  ('90000000-0000-4000-8000-000000000003', 'menor@teste.local');
update public.profiles set is_adult_confirmed = true, adult_confirmed_at = now()
 where id in ('90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002');
insert into public.dogs (id, owner_id, name, birth_month, size, energy, daily_minutes) values
  ('90000000-0000-4000-8000-0000000000a1', '90000000-0000-4000-8000-000000000001', 'Caramelo', '2024-01-01', 'medio', 'alta', 10),
  ('90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000002', 'Rex', '2020-01-01', 'grande', 'baixa', 5),
  ('90000000-0000-4000-8000-0000000000c1', '90000000-0000-4000-8000-000000000003', 'Pipoca', '2020-01-01', 'mini', 'baixa', 5);

select is((select public from storage.buckets where id = 'dog-photos'), false, 'bucket dog-photos é privado');
select is((select allowed_mime_types from storage.buckets where id = 'dog-photos'), array['image/jpeg'], 'bucket só aceita JPEG');
select is((select file_size_limit from storage.buckets where id = 'dog-photos'), 2097152::bigint, 'bucket limita a 2 MB');

-- Ana
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "90000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/90000000-0000-4000-8000-0000000000a1.jpg') $$,
  'Ana envia a foto do próprio cão'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/qualquer.jpg') $$,
  '42501', null, 'nome que não é <dog_id>.jpg é recusado'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/90000000-0000-4000-8000-0000000000aa.jpg') $$,
  '42501', null, 'cão inexistente é recusado'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/90000000-0000-4000-8000-0000000000b1.jpg') $$,
  '42501', null, 'cão de outro tutor na própria pasta é recusado'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000002/90000000-0000-4000-8000-0000000000b1.jpg') $$,
  '42501', null, 'Ana não escreve na pasta do Beto'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/90000000-0000-4000-8000-0000000000a1.png') $$,
  '42501', null, 'extensão diferente de .jpg é recusada'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'dog-photos'),
  1, 'Ana vê a própria foto'
);

-- Beto não vê, não substitui e não apaga a foto da Ana.
select set_config('request.jwt.claims', '{"sub": "90000000-0000-4000-8000-000000000002", "role": "authenticated"}', true);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'dog-photos'),
  0, 'Beto não vê a foto da Ana'
);
select is(
  pg_temp.linhas($$ update storage.objects set name = '90000000-0000-4000-8000-000000000002/90000000-0000-4000-8000-0000000000b1.jpg' where bucket_id = 'dog-photos' $$),
  0, 'Beto não altera a foto da Ana'
);
select set_config('storage.allow_delete_query', 'true', true);
select is(
  pg_temp.linhas($$ delete from storage.objects where bucket_id = 'dog-photos' $$),
  0, 'Beto não apaga a foto da Ana'
);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000001/90000000-0000-4000-8000-0000000000a1.jpg') $$,
  null, null, 'Beto não sobrescreve a foto da Ana'
);

-- Sem 18+ confirmado, nada de foto.
select set_config('request.jwt.claims', '{"sub": "90000000-0000-4000-8000-000000000003", "role": "authenticated"}', true);
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('dog-photos', '90000000-0000-4000-8000-000000000003/90000000-0000-4000-8000-0000000000c1.jpg') $$,
  '42501', null, 'sem 18+ não envia foto'
);
reset role;

-- Sem login
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'dog-photos'),
  0, 'anon não vê fotos'
);
reset role;

-- Ana apaga a própria foto (F12: excluir o cão apaga a foto).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "90000000-0000-4000-8000-000000000001", "role": "authenticated"}', true);
select is(
  pg_temp.linhas($$ delete from storage.objects where bucket_id = 'dog-photos' $$),
  1, 'Ana apaga a própria foto'
);
reset role;

select ok(not has_function_privilege('anon', 'public.can_write_dog_photo(text)', 'execute'), 'anon não executa can_write_dog_photo');

select * from finish();
rollback;
