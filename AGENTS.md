# AGENTS.md — Patinha

Patinha é um app de celular (iOS e Android) de **adestramento positivo gamificado para cães**: o tutor cadastra o cão, recebe um plano e faz treinos guiados de 5 a 15 minutos por dia (vídeo curto, passos, clicker), sobe de nível, mantém a sequência e compartilha cards.

Leia sempre, antes de qualquer tarefa: `docs/resumo.md`, `docs/roadmap.md` (ADRs e modelo de dados) e, para a fase em andamento, `docs/flows.md`. O andamento fica em `docs/progress.md`.

## Stack
- **App:** Expo (SDK estável mais recente) + React Native + TypeScript strict + Expo Router (pasta `app/`). Código em `src/features/<domínio>`, `src/lib`, `src/components/ui`.
- **Backend:** Supabase (Postgres + RLS, Auth com Google/Apple, Storage, Edge Functions em Deno, pg_cron).
- **Vídeos:** Cloudflare R2. **Assinaturas:** RevenueCat. **Builds e updates:** EAS.
- **Conteúdo:** `content/` (JSON), validado pela skill `licao-adestramento` e importado pela Edge Function `import-content`.

## Regras inegociáveis
1. **Bem-estar animal (ADR-07):**
   - só reforço positivo;
   - nenhum texto, exercício, card ou post sugere punição, enforcador, choque, bronca ou "dominância";
   - nunca prometa resultado garantido;
   - casos graves (agressividade com mordida, ansiedade severa, sinais de dor) recebem a orientação de procurar um profissional presencial ou um veterinário, e não um plano automático.
2. **Tom:** incentivo, nunca culpa. "Ainda não" faz parte do treino. Não chame o cão de teimoso, burro ou desobediente.
3. **Regras no banco (ADR-02 e ADR-05):** níveis, dia lógico, sequência, limites do plano e acesso Premium são garantidos por constraints, triggers, funções e RLS, porque o app fala direto com o PostgREST. Nunca calcule datas no app para gravar.
4. **Premium só pelo banco (ADR-06):** a interface usa o SDK do RevenueCat, mas toda liberação de conteúdo checa `is_premium` (tabela `entitlements`, escrita só pelo webhook).
5. **Privacidade:**
   - dados do cão, fotos e treinos são privados do dono;
   - toda tabela, função e política do Storage tem teste provando que outro usuário não acessa nada;
   - sem conteúdo público de usuários no MVP (ADR-08).
6. **Segredos:** nada secreto no app (só `EXPO_PUBLIC_*` públicos). Segredos ficam nas Edge Functions, nos secrets do GitHub ou do EAS. Nunca faça commit de `.env`.
7. **Expo (ADR-01):**
   - dependências nativas só com `npx expo install`;
   - nunca edite `ios/` ou `android/` à mão (use config plugins);
   - avise quando uma mudança exigir um development build novo (módulo nativo) ou quando bastar o EAS Update.
8. **Mensagens de tela** exatamente como em `docs/flows.md`, em pt-BR.
9. **Conteúdo:** nada é publicado sem a revisão do adestrador parceiro (`reviewed_by`). Você escreve rascunhos; quem aprova é ele.

## Comandos
Gerenciador de pacotes: **npm** (o `package-lock.json` é versionado; o CI usa `npm ci` com cache do `setup-node`). O Supabase CLI vem como devDependency (`npx supabase`) e precisa do Docker rodando.

| Comando | O que faz |
|---|---|
| `make install` | `npm ci` |
| `make dev` | `npx expo start` (QR code para o Expo Go) |
| `make db-up` / `make db-down` | sobe/para o Supabase local (API em `127.0.0.1:54321`, Studio em `localhost:54323`) |
| `make db-reset` | recria o banco local aplicando `supabase/migrations` e `supabase/seed.sql` |
| `make db-test` | testes pgTAP de `supabase/tests` (`supabase test db`) |
| `make types` | gera `src/lib/database.types.ts` a partir do banco local |
| `make test` | Jest (jest-expo + Testing Library) |
| `make lint` | ESLint (config do Expo) + Prettier `--check` |
| `make typecheck` | `tsc --noEmit` |
| `make doctor` | `expo-doctor` (precisa de internet para a API do Expo) |
| `make export-check` | `npx expo export --platform all` (pega erros de bundling) |
| `make check` | tudo acima, na ordem do CI |

Scripts equivalentes no `package.json`: `lint`, `format`, `format:check`, `typecheck`, `test`, `doctor`, `export:check`.

## Estrutura de pastas
```
app/                    rotas do Expo Router
  _layout.tsx           layout raiz (tema, safe area)
  (auth)/               telas sem sessão (login)
  (app)/                telas com sessão
src/
  features/<domínio>/   código de cada domínio (componentes, hooks, chamadas, testes)
  lib/                  supabase.ts (cliente), theme.ts (claro/escuro), utils.ts, database.types.ts (gerado)
  components/ui/        componentes visuais genéricos (Screen, Text…)
__tests__/              testes Jest de telas; testes de src ficam em __tests__/ ao lado do código
supabase/
  migrations/           migrations versionadas (nunca edite uma já aplicada)
  tests/                testes pgTAP (000_rls_em_tudo.sql garante RLS em toda tabela de public)
  functions/            Edge Functions (Deno)
content/                conteúdo de adestramento (JSON)
app.config.ts           config do Expo (projectId do EAS, updates.url, runtimeVersion fingerprint)
eas.json                perfis development, preview e production
```

## Convenções de código
- Imports internos com o alias `@/` (aponta para `src/`).
- Cliente Supabase: sempre `getSupabase()` de `@/lib/supabase` (criado sob demanda; sessão no AsyncStorage).
- Cores, espaçamentos e tipografia só via `useTheme()` de `@/lib/theme`.
- Tipos do banco: rode `make types` depois de cada migration e faça commit do arquivo gerado.

## Skills do projeto (`.claude/skills/`)
- `implementar-fase`: executa uma fase do roadmap de ponta a ponta.
- `licao-adestramento`: escreve, valida e revisa o conteúdo de `content/`.
- `card-compartilhavel`: cards de story (React Native + view-shot).
- `post-instagram`: posts, Reels/TikTok e calendário de conteúdo.

## Subagentes do projeto (`.claude/agents/`)
- `testador`: roda a verificação completa e devolve só as falhas.
- `revisor-seguranca`: RLS, Storage, Edge Functions, webhooks e segredos.
- `verificador-fluxos`: confere o código contra `docs/flows.md`.
- `revisor-conteudo`: pré-revisão de `content/` (nunca preenche `reviewed_by`/`published`).
- `designer-cards`: cards de story em `src/features/cards`.
- `social-media`: posts, roteiros e calendários em `marketing/`.

## CI e preview
- `ci.yml`: lint, typecheck, Jest, expo-doctor, export e pgTAP em todo PR.
- `preview.yml` (Fase P): em todo PR publica um EAS Update e comenta o QR code (Expo Go até a Fase 7). Usa `EXPO_GO_PREVIEW=true` para o runtime `exposdk:<SDK>`; ver `app.config.ts`.
- `db-dev.yml` (manual): aplica `supabase/migrations` no projeto `patinha-dev` (seed opcional). Rode antes de testar no preview um PR que traga migration.

## Sessões na nuvem
- `.claude/hooks/session-start.sh` (SessionStart, só com `CLAUDE_CODE_REMOTE=true`): roda `npm ci` quando o lockfile mudou, inicia o `dockerd` se preciso e sobe o Supabase local. Logs em `$TMPDIR/patinha-session-start/`.
- MCP `supabase-local` (`.mcp.json`) aponta para `http://localhost:54321/mcp` e só funciona com o Supabase local de pé.
