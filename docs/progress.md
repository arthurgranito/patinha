# Progresso do roadmap

Atualizado pela skill `implementar-fase`. Uma linha por fase; a "próxima fase" é a primeira que não está ✅.

| Fase | Nome | Status | Data | Custo mensal após a fase | Observações |
|---|---|---|---|---|---|
| V | Validação (docs/validacao.md) | ⬜ |  | R$ 0 | não é código |
| 0 | Fundação do projeto | 🔍 | 2026-10-15 | R$ 0 | TODO(fase 1): redirecionar (app)→(auth) sem sessão e tela de login real em `app/(auth)/entrar.tsx`. `expo-dev-client` entra quando houver o 1º development build (Fase 8). |
| P | Preview por PR (EAS Update) | ⬜ |  | R$ 0 |  |
| 1 | Login e perfil | ⬜ |  | R$ 0 |  |
| 2 | Esquema completo, RLS e seeds | ⬜ |  | R$ 0 |  |
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
