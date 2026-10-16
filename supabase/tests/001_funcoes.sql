-- Guarda transversal (convenção da Fase 0): toda função de public tem search_path vazio
-- e nenhuma é executável por anon.
begin;
create extension if not exists pgtap with schema extensions;

select plan(2);

select is(
  (
    select coalesce(array_agg(p.proname::text order by p.proname), '{}')
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prokind = 'f'
       and not coalesce(p.proconfig @> array['search_path=""'], false)
  ),
  '{}'::text[],
  'todas as funções de public têm search_path vazio'
);

select is(
  (
    select coalesce(array_agg(p.proname::text order by p.proname), '{}')
      from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prokind = 'f'
       and has_function_privilege('anon', p.oid, 'execute')
  ),
  '{}'::text[],
  'anon não executa nenhuma função de public'
);

select * from finish();
rollback;
