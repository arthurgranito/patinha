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
A Fase 0 cria o Makefile e os scripts. Depois dela, esta seção é atualizada com os comandos reais:
- `make dev`
- `make db-up`
- `make db-reset`
- `make db-test`
- `make types`
- `make test`
- `make lint`
- `make typecheck`
- `make check`

## Skills do projeto (`.claude/skills/`)
- `implementar-fase`: executa uma fase do roadmap de ponta a ponta.
- `licao-adestramento`: escreve, valida e revisa o conteúdo de `content/`.
- `card-compartilhavel`: cards de story (React Native + view-shot).
- `post-instagram`: posts, Reels/TikTok e calendário de conteúdo.
