-- Guarda transversal (AGENTS.md, regra 5): nenhuma tabela do schema public pode existir sem RLS.
begin;
create extension if not exists pgtap with schema extensions;

select plan(2);

select has_schema('public', 'schema public existe');

select is(
  (
    select coalesce(array_agg(c.relname::text order by c.relname), '{}')
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  '{}'::text[],
  'todas as tabelas de public têm RLS ligado'
);

select * from finish();
rollback;
