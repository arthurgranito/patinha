# Patinha — Skills, subagentes, MCPs e sessões na nuvem

Referência de como o Claude Code trabalha neste projeto. O passo a passo de quando fazer cada coisa está em `docs/passo-a-passo-nuvem.md`.

---

## 1. Skills (já vêm no repositório, em `.claude/skills/`)

| Skill | Para quê |
|---|---|
| `implementar-fase` | Executa uma fase do roadmap de ponta a ponta: plano, fatias com testes, verificação (lint, typecheck, Jest, pgTAP, expo-doctor, export) e roteiro de conferência no celular |
| `licao-adestramento` | Escreve e valida exercícios, programas e desafios em `content/`, com as regras de reforço positivo e o roteiro de revisão do adestrador |
| `card-compartilhavel` | Cards de story em React Native (view-shot + expo-sharing), com fixtures de borda e a prancha de revisão |
| `post-instagram` | Reels/TikTok, carrosséis e calendário, no tom do Patinha, com o verificador de legendas |

---

## 2. Subagentes

A skill `implementar-fase` roda na **conversa principal** (ela para no plano e espera o seu OK; subagentes não conseguem fazer perguntas). Os subagentes fazem o trabalho de apoio.

Este prompt é colado na **sessão de preparação** (Parte 5 do passo a passo):

```
Crie 6 subagentes de projeto em .claude/agents/ para o Patinha (leia AGENTS.md e docs/roadmap.md antes). Todos com frontmatter válido começando em "---", com name e description.

1) testador.md
- description: Roda a verificação completa do Patinha e devolve só as falhas. Use proativamente depois de qualquer mudança de código e antes de concluir uma fase.
- tools: Read, Grep, Glob, Bash · model: sonnet
- Corpo: descobrir os comandos no Makefile/package.json; rodar sem parar no primeiro erro: lint, typecheck, jest, `supabase test db` (subindo o Supabase local se preciso), expo-doctor e `npx expo export --platform all` para checar o bundle; para cada falha: etapa, comando, arquivo:linha, mensagem em até 15 linhas e causa provável; com tudo verde, uma linha ✅ por etapa. Nunca alterar arquivos nem pular testes.

2) revisor-seguranca.md
- description: Revisa migrations, RLS, políticas do Storage, funções SQL, Edge Functions, webhooks e o app procurando vazamento entre usuários, segredos expostos e regras contornáveis. Use proativamente quando uma mudança tocar supabase/, Edge Functions, assinaturas ou dados pessoais.
- tools: Read, Grep, Glob, Bash · model: opus · memory: project
- Corpo: consultar a memória; ler `git diff main...HEAD`; rodar `supabase test db`; checklist:
  (a) toda tabela com RLS e política por operação; nenhum usuário lê o cão, as fotos, os treinos ou as conquistas de outro;
  (b) conteúdo Premium só via is_premium/get_exercise, sem vazar video_url ou steps na lista;
  (c) entitlements escrita só pelo webhook do RevenueCat (header de autorização + idempotência por event.id);
  (d) training_sessions com user_id = auth.uid(), dono do cão, dia lógico no banco, só hoje/ontem, desfazer até 24h;
  (e) funções security definer com search_path vazio;
  (f) Edge Functions com segredo; pg_cron chamando com segredo;
  (g) nenhum segredo no app (só EXPO_PUBLIC_*) nem em .env versionado;
  (h) Storage dog-photos privado com URLs assinadas;
  (i) exclusão de conta apagando tudo.
  Devolver Crítico / Importante / Sugestão com arquivo:linha e a correção; não alterar código; salvar na memória os padrões recorrentes.

3) verificador-fluxos.md
- description: Confere se o código implementa o que docs/flows.md descreve: passos, alternativos, erros e mensagens exatas. Use antes de concluir uma fase ou quando pedirem para validar fluxos (ex.: "F19").
- tools: Read, Grep, Glob, Bash · model: sonnet
- Corpo: receber uma fase ou IDs de fluxo; com uma fase, rodar `python .claude/skills/implementar-fase/scripts/extrair_fase.py <N>`; para cada passo, alternativo e erro, achar onde é tratado e procurar o texto literal das mensagens com grep; devolver uma tabela item | ✅ / ⚠️ diferente / ❌ ausente | arquivo:linha | observação, com os totais. Marcar ⚠️ qualquer texto fora das regras de tom e bem-estar animal do AGENTS.md. Não alterar arquivos.

4) revisor-conteudo.md
- description: Revisa exercícios, programas e desafios de content/ quanto à segurança (reforço positivo), clareza, critérios de nível observáveis e coerência de idade e tempo, antes da revisão humana do adestrador. Use sempre que content/ mudar.
- tools: Read, Grep, Glob, Bash · model: opus · skills: [licao-adestramento]
- Corpo: rodar o validador da skill; ler cada item alterado como um tutor leigo e como um adestrador de método positivo; apontar passos ambíguos, critérios que o tutor não consegue julgar, riscos de segurança, promessas e jargão; propor o texto corrigido. NUNCA preencher reviewed_by nem published (isso é do adestrador humano). Devolver a tabela item | problema | sugestão.

5) designer-cards.md
- description: Cria e ajusta os cards de story do Patinha (truque dominado, sequência, conquista, carteirinha, desafio) em src/features/cards e corrige problemas de captura e compartilhamento.
- tools: Read, Edit, Write, Bash, Grep, Glob · model: inherit · skills: [card-compartilhavel]
- Corpo: seguir a skill; editar só src/features/cards/ e os testes relacionados; template novo sem brief claro → devolver o brief proposto sem implementar; garantir fixtures de borda e snapshots; devolver o roteiro para conferir no celular pelo QR do PR.

6) social-media.md
- description: Escreve posts, roteiros de Reels/TikTok, carrosséis e calendários do Patinha, inclusive os vídeos da fase de validação. Use para qualquer pedido de conteúdo para redes sociais.
- tools: Read, Write, Edit, Grep, Glob, Bash · model: sonnet · skills: [post-instagram] · memory: project
- Corpo: seguir a skill; ler docs/progress.md, docs/validacao.md e marketing/posts.md antes; salvar em marketing/semana-AAAA-MM-DD.md; validar as legendas com checar_legenda.py e corrigir os ❌; dica técnica só se estiver em content/ revisado ou marcada "precisa de ok do adestrador"; escrever as suposições no topo do arquivo; registrar na memória o que funcionou.

Mostre os 6 arquivos finais.
```

**Como chamar:** pelo nome ("use o testador") ou com `@`, por exemplo `@"revisor-conteudo (agent)" revisa o content/ novo`.

---

## 3. MCPs

Adicione cada MCP **na fase em que ele passa a ser útil**, porque cada um ocupa contexto em toda conversa.

| MCP | Para quê | Quando |
|---|---|---|
| Supabase (local) | ver tabelas, rodar SQL, testar RLS e triggers de progressão | sessão de preparação (depois da Fase 0) |
| Cloudflare (docs) | documentação do R2 (vídeos) e do Pages (site) | Fase 4 |
| Sentry | erros do app em produção | Fase 13 |
| PostHog | funil (cadastro → treino → paywall → assinatura) e UTM dos posts | Fase 13 |

```bash
claude mcp add --scope project --transport http supabase-local http://localhost:54321/mcp
claude mcp add --scope project --transport http cloudflare-docs https://docs.mcp.cloudflare.com/mcp
claude mcp add --scope project --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add --scope project --transport http posthog https://mcp.posthog.com/mcp
```

- **Supabase local:** só funciona com o `supabase start` rodando, e não pede login.
- **Supabase na nuvem:** se um dia usar o MCP hospedado, use **só o projeto de desenvolvimento e em modo somente leitura**, nunca a produção:
  `"https://mcp.supabase.com/mcp?project_ref=<REF_DEV>&read_only=true"`.
- **GitHub:** não precisa de MCP; o Claude Code usa o `gh`.
- **Depois da Fase 13:** adicione `mcpServers: [posthog]` ao subagente `social-media`, para ele ler os resultados dos posts sozinho.

**Conferir:** `/mcp` dentro do Claude Code (faça o login dos que pedirem) e `claude mcp list` no terminal.

---

## 4. Sessões na nuvem: o essencial

- **O que vai junto com o clone:** `AGENTS.md`/`CLAUDE.md`, `.claude/skills`, `.claude/agents`, `.claude/settings.json` e `.mcp.json`. O que só existe no seu computador fica de fora.
- **Docker:** a máquina tem, então o Supabase local roda lá (`supabase start`).
- **Sem celular nem emulador na nuvem:** a verificação lá é lint, typecheck, Jest, pgTAP, expo-doctor e o export. **Você confere no celular** pelo QR code do EAS Update que aparece em cada PR (Fase P).
- **Builds nativos** (development build, a partir da Fase 8, e os builds de loja) rodam nos servidores do EAS, disparados por um workflow do GitHub ou pelo seu computador, nunca dentro da sessão.
- **Segredos:** nunca nas variáveis do ambiente da nuvem; use os secrets do GitHub, os do EAS ou os das Edge Functions.
- **Créditos:**
  - uma sessão por fase, com `/compact` quando ficar longa;
  - nunca duas fases ao mesmo tempo, porque elas dependem uma da outra e dividem o banco de desenvolvimento;
  - em paralelo, só o que é independente (posts, conteúdo, cards).
