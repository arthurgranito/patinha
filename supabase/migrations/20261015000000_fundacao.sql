-- Fase 0 — Fundação.
-- Migration base: as tabelas chegam a partir da Fase 1. Convenções valem para todas as migrations:
--   * toda tabela em public nasce com RLS ligado (o teste supabase/tests/000_rls_em_tudo.sql garante);
--   * funções com `set search_path = ''` e nomes qualificados;
--   * nunca editar uma migration já aplicada: crie outra.

comment on schema public is 'Patinha: dados do app. Toda tabela com RLS ligado.';
