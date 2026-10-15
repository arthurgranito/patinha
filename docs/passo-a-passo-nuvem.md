# Patinha — passo a passo do zero no Claude Code na nuvem

Da pasta vazia no seu computador até o app nas lojas. Siga na ordem; cada parte diz o tempo aproximado.

| Parte | O quê | Tempo |
|---|---|---|
| 0 | Validação (sem código) | 2 semanas |
| 1 | Montar a pasta e subir para o GitHub | 20 min |
| 2 | Criar as contas grátis (Expo, Supabase dev, Google) | 1 h |
| 3 | Configurar o Claude Code na nuvem | 15 min |
| 4 | Sessão 1: Fase 0 (fundação) | 1 sessão |
| 5 | Sessão 2: preparação (hook, subagentes, MCP) | 1 sessão |
| 6 | Sessão 3: Fase P (preview no celular por PR) | 1 sessão |
| 7 | Ciclo das Fases 1 a 15 | ~14–18 semanas |
| 8 | O que é manual em cada fase | consulta |
| 9 | Problemas comuns | consulta |

---

## Parte 0 — Validação (antes de tudo)

Siga `docs/validacao.md`:
- 10 conversas com tutores;
- uma página de lista de espera com o botão "Assinar por R$ 14,90";
- de 6 a 8 vídeos;
- 5 a 10 adestradores contatados.

**Só siga para a Parte 1 com os três sinais verdes:** 300+ na lista, 10%+ clicando em "Assinar" e 1 adestrador parceiro.

> **Dica:** a skill `post-instagram` ajuda a roteirizar os vídeos da validação. Dá para usá-la aqui no chat (é só pedir os roteiros) ou numa sessão do Claude Code depois da Parte 3.

---

## Parte 1 — Montar a pasta e subir para o GitHub

1. **Baixe o arquivo `patinha-repo-inicial.zip`** e descompacte-o. Ele já traz a pasta `patinha/` pronta:
   ```
   patinha/
   ├── .claude/skills/        (implementar-fase, licao-adestramento, card-compartilhavel, post-instagram)
   ├── content/               (exercícios, programa e desafio de EXEMPLO, não publicados)
   ├── docs/                  (resumo, validacao, roadmap, flows, agentes-mcps-e-nuvem, passo-a-passo-nuvem)
   ├── AGENTS.md
   ├── CLAUDE.md
   ├── README.md
   └── .gitignore
   ```
   > **Windows:** ative "Itens ocultos" no Explorer para ver as pastas `.claude` e o `.gitignore`.

2. **No GitHub**, crie um repositório **novo, privado e vazio** chamado `patinha`, sem README nem .gitignore.

3. **No terminal**, dentro da pasta:
   ```bash
   cd patinha
   git init -b main
   git add .
   git commit -m "docs: projeto Patinha (roadmap, fluxos, skills e conteúdo de exemplo)"
   git remote add origin https://github.com/SEU_USUARIO/patinha.git
   git push -u origin main
   ```
   (Ou pelo GitHub Desktop: "Add existing repository" → "Publish repository".)

---

## Parte 2 — Contas grátis (uma vez)

Anote cada valor indicado; ele vai para os secrets do GitHub no passo 2.4.

### 2.1 Expo (expo.dev)
1. Crie a conta.
2. Em *Projects → Create a project*, crie o projeto com o nome **patinha** e anote o **Project ID**.
3. Em *Account settings → Access tokens*, crie um token e anote: é o **`EXPO_TOKEN`**.
4. No celular, instale o app **Expo Go** (App Store ou Google Play).

### 2.2 Supabase (supabase.com)
1. Crie a conta e um projeto **`patinha-dev`** (região São Paulo, com uma senha de banco forte).
2. Anote:
   - **Project URL** e **anon key** (*Project Settings → API*);
   - **Project ref** (o código que aparece na URL do projeto);
   - a **senha do banco**;
   - um **Access Token** pessoal (*Account → Access Tokens*).

### 2.3 Login com Google (console.cloud.google.com)
1. Crie um projeto e configure a tela de consentimento OAuth (tipo "Externo").
2. Crie uma credencial **OAuth Client ID** do tipo **Web** e, em *Authorized redirect URIs*, coloque `https://<SEU_REF>.supabase.co/auth/v1/callback`.
3. No Supabase `patinha-dev`:
   - *Authentication → Providers → Google*: ligue e cole o Client ID e o Secret;
   - *Authentication → URL Configuration → Redirect URLs*: adicione `patinha://**` e `exp://**` (para o Expo Go).

   A sessão da Fase 1 confirma se falta alguma URL.

### 2.4 Secrets no GitHub
No repositório: *Settings → Secrets and variables → Actions → New repository secret*.

| Secret | Valor |
|---|---|
| `EXPO_TOKEN` | 2.1 |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL do `patinha-dev` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon key do `patinha-dev` |
| `SUPABASE_ACCESS_TOKEN` | 2.2 |
| `SUPABASE_DEV_PROJECT_REF` | 2.2 |
| `SUPABASE_DEV_DB_PASSWORD` | 2.2 |

> **Ainda não precisa:** contas Apple Developer (US$ 99/ano) e Google Play (US$ 25 uma vez), RevenueCat, Sentry, PostHog e Cloudflare. A Parte 8 diz em que fase cada uma entra.

---

## Parte 3 — Configurar o Claude Code na nuvem

1. Abra **claude.ai/code**.
2. **Conecte o GitHub** e instale o app do Claude **no repositório `patinha`**. O app também conserta sozinho um PR quando o CI falha.
3. **Crie o ambiente `patinha`** (ícone de nuvem acima da caixa de mensagem):
   - **Rede:** "Custom", **incluindo a lista padrão**. Se algo for bloqueado (imagens do Supabase, `api.expo.dev` usada pelo expo-doctor), adicione o domínio que o erro mostrar.
   - **Variáveis de ambiente:** vazio. **Nunca coloque chaves aqui.**

---

## Parte 4 — Sessão 1: Fase 0 (fundação)

Abra uma sessão no repositório `patinha`, com o ambiente `patinha`, e cole:
```
Implemente a fase 0 usando a skill implementar-fase. O Project ID do Expo é <COLE_AQUI>: coloque em app.config.ts (extra.eas.projectId e updates.url) em vez de rodar eas init.
```

Depois:
1. Leia o plano, responda "ok" e acompanhe.
2. No fim, revise o PR e faça o merge.
3. **Opcional, para ver no celular já agora:** no seu computador, `git pull`, `npm install`, `npx expo start` e escaneie o QR com o Expo Go. A partir da Fase P, o QR vem no próprio PR.
4. **Feche a sessão.**

---

## Parte 5 — Sessão 2: preparação

Abra uma **sessão nova** (agora já existe `package.json`) e cole:
```
Sessão de preparação do Patinha, numa branch chore/preparacao:
1. SessionStart hook em .claude/settings.json que, só quando CLAUDE_CODE_REMOTE=true, instala as dependências (npm ci ou o gerenciador definido na fase 0) e sobe o Supabase local (supabase start). Teste, me diga quanto tempo leva e liste qualquer domínio bloqueado pela rede.
2. Execute o prompt da seção "2. Subagentes" de docs/agentes-mcps-e-nuvem.md (os 6 arquivos em .claude/agents/).
3. Adicione o MCP do Supabase local com --scope project: claude mcp add --scope project --transport http supabase-local http://localhost:54321/mcp
4. Confirme que lint, typecheck e testes continuam verdes. Não mude código de produto.
Abra o PR com o resumo.
```

Faça o merge e **feche a sessão**. Os subagentes só são carregados em sessões novas.

---

## Parte 6 — Sessão 3: Fase P (preview no celular)

Com os secrets da Parte 2.4 criados, abra uma sessão nova:
```
Implemente a fase P do roadmap (preview por PR com EAS Update). Os secrets já estão no GitHub com estes nomes: EXPO_TOKEN, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN, SUPABASE_DEV_PROJECT_REF, SUPABASE_DEV_DB_PASSWORD.
```

Depois do merge:
1. Rode o workflow manual **"db-dev"** no GitHub (aba *Actions*) para aplicar as migrations no `patinha-dev`.
2. A partir daqui, **todo PR ganha um QR code**. Abra a câmera do celular, escaneie e o Expo Go abre a versão daquele PR.

---

## Parte 7 — Ciclo de cada fase (1 a 15)

Uma **sessão nova por fase**, sempre a partir da `main` atualizada.

1. **Abra a sessão** e cole:
   ```
   Implemente a fase N usando a skill implementar-fase.
   ```
2. **Leia o plano.** Confira principalmente:
   - o que ficou **fora do escopo**;
   - se a fase **exige um development build novo**;
   - os **passos manuais seus** (Parte 8).

   Responda "ok" ou peça ajustes. Na dúvida, cole o plano no chat do Claude para uma segunda opinião.
3. **Antes de conferir, peça a revisão:**
   ```
   Use o revisor-seguranca e o verificador-fluxos nesta fase e corrija os itens críticos.
   ```
   Se a fase mexeu em `content/`, peça também o `revisor-conteudo`.
4. **Confira no celular** pelo QR do PR, seguindo o roteiro "Confira na tela" do relatório.
   - Até a Fase 7: **Expo Go**.
   - Da Fase 8 em diante: o **development build** (a Fase 8 explica como instalar).
   - Os roteiros **Maestro** listados no relatório rodam no seu computador, com o celular conectado (opcional).
5. **Feche a fase:**
   - **Problema:** descreva na mesma sessão, sem fechar.
   - **Tudo certo:** escreva `fase N confirmada`, faça o merge do PR e **feche a sessão**.
6. **Se a fase criou migrations:** rode de novo o workflow **"db-dev"** depois do merge, para o preview usar o banco atualizado.

**Ordem:** 1 → 2 → 3 → … → 15.

**Em paralelo, desde a Fase 4:** o conteúdo com o adestrador. Use o `revisor-conteudo` e a skill `licao-adestramento` para os rascunhos e o roteiro de revisão, e grave os vídeos com ele.

---

## Parte 8 — O que é manual em cada fase

| Fase | O que você faz |
|---|---|
| 0 | Colar o Project ID do Expo; conferir no Expo Go |
| P | Os secrets do GitHub (Parte 2.4); rodar o "db-dev" |
| 1 | Conferir as redirect URLs do login no Supabase e no Google (a sessão te diz quais) |
| 4 | Criar a conta **Cloudflare** (grátis) e o bucket **R2** `patinha-videos` com acesso público; subir os vídeos (o `docs/conteudo.md`, criado na fase, explica); começar as gravações com o adestrador |
| 8 | Instalar o **development build** no Android (APK, grátis). Para o iPhone, crie a conta **Apple Developer** (US$ 99/ano) |
| 12 | Contas **Apple Developer** e **Google Play Console** (US$ 25 uma vez); criar os produtos de assinatura nas duas lojas; conta **RevenueCat** (grátis até US$ 2.500/mês), com o webhook apontando para a Edge Function; chaves públicas do RevenueCat nos secrets do EAS/GitHub |
| 13 | Contas **Sentry** e **PostHog** (grátis); chaves nos secrets; adicionar os MCPs (`claude mcp add` da seção 3 do guia de agentes) |
| 14 | Domínio (≈ R$ 40/ano); site no Cloudflare Pages; capturas de tela; formulários de privacidade das lojas (a sessão prepara os textos) |
| 15 | Projeto Supabase de **produção** (plano Pro, ≈ US$ 25/mês); conteúdo final revisado e publicado; termos revisados por um advogado; **apertar o botão de envio** para a revisão das lojas |

**Custos:**
- **R$ 0** até a Fase 7.
- **R$ 0 a 45/mês** na Fase 8 (Apple só se quiser testar no iPhone).
- **≈ R$ 48/mês + R$ 140 uma vez** da Fase 12 à 14.
- **≈ R$ 187/mês** depois do lançamento.

---

## Parte 9 — Problemas comuns

| Problema | O que fazer |
|---|---|
| O QR do PR abre o Expo Go mas dá erro de "runtime" ou "SDK" | Atualize o Expo Go no celular. A partir da Fase 8, use o development build, não o Expo Go |
| Domínio bloqueado na sessão | Adicione o domínio do erro na rede do ambiente `patinha` e abra uma sessão nova |
| `supabase start` falhou na nuvem | Peça: "rode supabase start e me mostre o erro"; geralmente é um download de imagem bloqueado |
| Skills ou subagentes não aparecem | Confira que estão na `main` em `.claude/`; abra uma sessão nova depois do merge |
| O CI falhou no PR | Peça na sessão: "conserte o CI deste PR" |
| Login com Google não volta para o app | Falta `patinha://**` ou `exp://**` nas Redirect URLs do Supabase |
| O preview usa o banco desatualizado | Rode o workflow "db-dev" depois do merge das migrations |
| A sessão "esqueceu" o contexto | `/compact`; se piorar, abra outra com "continue a fase N; leia docs/progress.md e o PR aberto" |
| Plano com algo estranho | Cole o plano no chat do Claude antes de aprovar |
| Mudança nativa não aparece no celular | Mudanças nativas não vão por EAS Update: precisa de um development build novo (a skill avisa no plano) |
