# Progresso do roadmap

Atualizado pela skill `implementar-fase`. Uma linha por fase; a "próxima fase" é a primeira que não está ✅.

| Fase | Nome | Status | Data | Custo mensal após a fase | Observações |
|---|---|---|---|---|---|
| V | Validação (docs/validacao.md) | ⬜ |  | R$ 0 | não é código |
| 0 | Fundação do projeto | ✅ | 2026-10-15 | R$ 0 | Conferido: Expo Go e CI verde. `make db-up` dispensado pelo usuário (testado no ambiente na nuvem e no CI). TODO(fase 1): redirecionar (app)→(auth) sem sessão e tela de login real em `app/(auth)/entrar.tsx`. `expo-dev-client` entra quando houver o 1º development build (Fase 8). |
| P | Preview por PR (EAS Update) | ✅ | 2026-10-15 | R$ 0 | Conferido: QR no PR abriu no Expo Go (runtime exposdk:57.0.0). `.github/workflows/preview.yml` (QR do Expo Go em cada PR) e `db-dev.yml` (manual: migrations no patinha-dev). TODO(fase 8): preview passa a mirar o development build; sai o `EXPO_GO_PREVIEW`. |
| 1 | Login e perfil | ✅ | 2026-10-16 | R$ 0 | Conferido pelo usuário. Passos manuais em `docs/auth.md` (Google Cloud, Redirect URLs `patinha://**` e `exp://**`, `db-dev`). TODO(fase 2): FK de `profiles.active_dog_id`. TODO(fase 3): cadastro do cão real e ramo "sem cão" do F03; grant de `active_dog_id` (F11). TODO(fase 8): apagar o token de push ao sair. TODO(fase 10): aviso da fila offline ao sair. TODO(fase 13): eventos `signup`/`onboarding_completed`, Sentry no X.3 (substitui o "Detalhes"), termos definitivos. TODO(fase 14): Entrar com Apple. |
| 2 | Esquema completo, RLS e seeds | 🟡 |  | R$ 0 |  |
| 3 | Cadastro do cão | ⬜ |  | R$ 0 |  |
| 4 | Conteúdo: pipeline, vídeos e biblioteca | ⬜ |  | R$ 0 |  |
| 5 | Plano personalizado e treino do dia | ⬜ |  | R$ 0 |  |
| 6 | Sessão de treino e progressão | ⬜ |  | R$ 0 |  |
| 7 | Sequência, congelamento, conquistas e carteirinha | ⬜ |  | R$ 0 |  |
| 8 | Lembretes (notificações) | ⬜ |  | R$ 0 a 45 | development build |
| 9 | Cards compartilháveis | ⬜ |  | R$ 0 a 45 |  |
| 10 | Offline | ⬜ |  | R$ 0 a 45 |  |
| 11 | Desafio do mês | ⬜ |  | R$ 0 a 45 |  |
| 12 | Assinatura Premium | ⬜ |  | ≈ R$ 45 (+ US$ 25 uma vez) |  |
| 13 | Segurança, LGPD e observabilidade | ⬜ |  | ≈ R$ 45 |  |
| 14 | Preparação para as lojas | ⬜ |  | ≈ R$ 48 |  |
| 15 | Lançamento | ⬜ |  | ≈ R$ 187 |  |

Legenda: ⬜ não iniciada · 🟡 em andamento · 🔍 aguardando sua verificação no celular · ✅ concluída

## Desvios registrados

Decisões tomadas durante a implementação que divergem do roadmap ou dos fluxos (fase, o quê, por quê).

- **Fase 0 — branch.** O prompt pede `feat/fundacao` e a skill pede `fase-0-fundacao`; o trabalho foi feito em `claude/stoic-gauss-l6qz3l`, a branch designada pela sessão na nuvem.
- **Fase 0 — EAS já ligado em parte.** Em vez de rodar `eas init`, o Project ID (`3f416ac5-2de9-40e8-a144-751e9a0ce2cd`) foi colocado direto no `app.config.ts` (`extra.eas.projectId` e `updates.url = https://u.expo.dev/<id>`), a pedido do usuário. `expo-updates` já está instalado (vem no Expo Go; não exige build novo). Falta da Fase P: o workflow de preview e os secrets.
- **Fase 0 — sem `expo-dev-client`.** O perfil `development` do `eas.json` já existe, mas o pacote não foi instalado: com ele, `npx expo start` passa a mirar o development build em vez do Expo Go, o que quebraria o critério desta fase. Instalar com `npx expo install expo-dev-client` na Fase 8.
- **Fase 0 — Supabase CLI como devDependency** (`npx supabase`), para a versão ficar fixa no lockfile. No CI, o job de banco usa `supabase/setup-cli` e sobe só os serviços necessários para o pgTAP.
- **Fase 0 — teste de guarda de RLS.** `supabase/tests/000_rls_em_tudo.sql` falha se qualquer tabela de `public` existir sem RLS, valendo para todas as fases.
- **Fase P — branch.** O prompt pede `chore/preview`; o trabalho foi feito em `claude/friendly-mccarthy-tsbmhw`, a branch designada pela sessão na nuvem.
- **Fase P — sem `eas update:configure`.** O que ele faria já estava feito na Fase 0: `updates.url` e `extra.eas.projectId` no `app.config.ts` e os canais `development`, `preview` e `production` no `eas.json`.
- **Fase P — runtime do preview.** O Expo Go só abre updates com runtime `exposdk:<SDK>`; com a política `fingerprint` o QR abriria um erro de incompatibilidade. O `preview.yml` liga `EXPO_GO_PREVIEW=true`, e o `app.config.ts` troca para a política `sdkVersion` (`exposdk:57.0.0`) só nesse caso. Builds e updates reais seguem com `fingerprint`. Teste: `__tests__/app-config.test.ts`.
- **Fase P — comando do preview.** `eas update --auto --branch <branch do PR> --environment preview --platform all`: o `--branch` explícito porque o checkout do PR fica em HEAD destacado, e o `--environment` porque o eas-cli exige a partir do SDK 55. As `EXPO_PUBLIC_*` vêm dos secrets do GitHub; se você criar variáveis com o mesmo nome no ambiente `preview` do EAS, confira qual valor prevalece. PRs de forks não publicam preview (não recebem secrets).
- **Fase P — `db-dev` com `--dry-run`.** Além do seed opcional (`--include-seed`), o workflow tem a opção de só listar as migrations. O seed roda a cada vez que for marcado: os seeds das próximas fases precisam ser idempotentes (`on conflict do nothing`).

- **Fase 1 — branch.** A skill pede `fase-1-login-e-perfil`; o trabalho foi feito em `claude/sharp-cerf-hmq8sf`, a branch designada pela sessão na nuvem.
- **Fase 1 — login de teste.** Fora do roadmap, a pedido do usuário, para o Maestro: botão "Entrar como teste", só com `__DEV__` e `EXPO_PUBLIC_DEV_LOGIN=true`. O `require` dele é condicional a `__DEV__`, então o Metro o corta dos bundles de produção (preview e loja); `scripts/check-bundle.sh` (dentro do `npm run export:check`, no CI) falha se ele aparecer. O usuário `teste@patinha.local` fica em `supabase/dev/usuario-teste.sql`, aplicado só por `make db-reset`/`make db-dev-login`, e não no `seed.sql`, porque o `db-dev` pode rodar o seed no `patinha-dev`. Testes: `src/features/auth/__tests__/devLogin.test.ts` e `__tests__/entrar.test.tsx`.
- **Fase 1 — fuso validado por trigger** (`profiles_validate_timezone`, contra `pg_timezone_names`), não por check constraint.
- **Fase 1 — sair só neste aparelho:** `signOut({ scope: 'local' })`, porque o padrão do supabase-js encerra as sessões em todos os aparelhos.
- **Fase 1 — nome de reserva no trigger:** sem `full_name`/`name` do provedor, usa a parte local do e-mail ou "Tutor" (sempre 1 a 40 caracteres).
- **Fase 1 — rota de onboarding em vez de `Stack.Protected` dentro de (app):** (abas) e cadastro-cao redirecionam para `/onboarding` sem 18+; assim o onboarding consegue levar para o cadastro do cão logo depois de confirmar.
- **Fase 1 — contraste (X.5):** no tema claro, `onPrimary` passou de branco para grafite (2,46:1 → 6,96:1), `success` e `danger` escureceram e entrou o token `link`. Teste em `src/lib/__tests__/theme.test.ts`.
- **Fase 1 — revisões (revisor-seguranca e verificador-fluxos).** Corrigidos: ErrorBoundary na raiz com a mensagem do X.3 (antes só a falha ao carregar o perfil tinha); X.1 nas ações desta fase ("Continuar" e "Salvar" desabilitados com "Você está offline"); `scripts/check-bundle.sh` agora falha se o export não existir ou o grep der erro (antes aprovava). Depois, a pedido do usuário: Redirect URLs da nuvem só `patinha://auth` e `exp://u.expo.dev/<project-id>/**` (o `exp://**` fica só no `config.toml` local); provedor Email desligado no painel do `patinha-dev` (e na produção, Fase 15); check `profiles_display_name_sem_controle` (o trigger e o app trocam esses caracteres por espaço); log da URL de retorno em `__DEV__`. As demais recomendações viraram linhas na seção 5 do `docs/flows.md` (Fases 2, 6, 14 e 15). O erro no "Sair" fica sem mensagem (o `scope: 'local'` não usa a rede).
- **Fase 1 — e-mail ligado só no Supabase local.** O pedido era desligar o cadastro por e-mail também no `config.toml`, mas no CLI `[auth.email] enable_signup = false` desliga o provedor inteiro, inclusive o login com senha do "Entrar como teste". Por isso ele fica ligado no local (que não é exposto) e desligado na nuvem pelo painel (`docs/auth.md`, seção 2, passo 4). No painel, o certo é desligar o provedor Email, e não o "Allow new users to sign up" geral, que bloquearia o Google.
- **Fase 1 — bug do preview (usuário apagado).** Com o usuário apagado no Supabase, o app restaurava a sessão salva (o PostgREST ainda aceitava o JWT), não achava o perfil e prendia o tutor na tela de erro. Agora: (1) ao abrir, a sessão salva é conferida com `auth.getUser()`; se o servidor a recusar, `signOut({ scope: 'local' })` e entrada com "Sua sessão expirou. Entre de novo." (sem rede, a sessão fica); (2) perfil ausente de usuário válido é criado por `ensure_profile()` (security definer, só o próprio `auth.uid()`, idempotente, não cria para usuário inexistente no Auth); o nome padrão saiu para `default_display_name()`, usado também pelo trigger; (3) a tela de erro tem "Sair". Comportamento documentado no X.2 e no X.3 do `docs/flows.md`.
- **Fase 1 — "Detalhes" na tela de erro (temporário, até o Sentry na Fase 13).** Mostra o código e a mensagem técnica do erro em desenvolvimento e nos previews (`EXPO_PUBLIC_ERROR_DETAILS=true` no `preview.yml` e no perfil `preview` do `eas.json`); produção não define a variável (teste em `src/lib/__tests__/errorDetails.test.ts`). Remover ou trocar pelo Sentry na Fase 13.
- **Fase 1 — `expo` 57.0.30 e `expo-router` 57.0.28.** Atualização de patch pedida pelo `expo-doctor` (o CI falharia); feita com `npx expo install`.
- **Fase 1 — fusos no Perfil:** a tela oferece os fusos do Brasil e o do aparelho (o banco aceita qualquer fuso IANA).

### Como abrir o preview de um PR no celular

- **Até a Fase 7 (Expo Go):** instale o Expo Go (versão do SDK 57) e escaneie o QR do comentário "EAS Update" do PR. No iPhone, use a câmera; no Android, use o leitor do próprio Expo Go. O app abre o update daquele commit, apontando para o Supabase `patinha-dev`. Cada push no PR publica um update novo e atualiza o mesmo comentário. Se o PR trouxer migration, rode antes Actions → **db-dev** → Run workflow.
- **A partir da Fase 8 (development build):** instale o development build do perfil `development` (canal `development`); o preview deixa de usar `EXPO_GO_PREVIEW` e o QR passa a abrir no build (`qr-target: dev-build`). Se o PR mudar código nativo, o runtime (fingerprint) muda e é preciso um build novo antes do QR funcionar.
