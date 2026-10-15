# Login (Fase 1): configuração

O app entra com Google pelo navegador do sistema (ADR-03): `signInWithOAuth` (PKCE) → `openAuthSessionAsync` → o Supabase volta para o app com `?code=` → `exchangeCodeForSession`. O código fica em `src/features/auth/`.

## URL de volta (redirect) que o app usa

`makeRedirectUri({ scheme: 'patinha', path: 'auth' })` gera:

| Onde o app roda | Redirect URL |
|---|---|
| Development build, preview interno, loja | `patinha://auth` |
| Expo Go (`npx expo start`) | `exp://<IP do computador>:8081/--/auth` |
| Expo Go abrindo o QR do PR (EAS Update) | `exp://u.expo.dev/<...>/--/auth` |

Como o endereço do Expo Go muda com o IP e o update, as Redirect URLs são cadastradas com curinga.

## Passos manuais (uma vez)

### 1. Google Cloud: cliente OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → crie (ou escolha) o projeto **Patinha**.
2. **APIs e serviços → Tela de consentimento OAuth:**
   - tipo **Externo**;
   - nome "Patinha", e-mail de suporte;
   - escopos `openid`, `email` e `profile`;
   - enquanto o app estiver em "Teste", adicione seu e-mail em **Usuários de teste**.
3. **Credenciais → Criar credenciais → ID do cliente OAuth:**
   - tipo **Aplicativo da Web**;
   - em **URIs de redirecionamento autorizados**, coloque só o callback do Supabase: `https://<project-ref>.supabase.co/auth/v1/callback`. O `<project-ref>` está em Supabase → Project Settings → General.
   - Não cadastre `patinha://` nem `exp://` aqui: quem volta para o app é o Supabase, não o Google.
4. Copie o **Client ID** e o **Client secret**.

### 2. Supabase (`patinha-dev` e, depois, produção)

1. **Authentication → Sign In / Providers → Google:**
   - ligue o provedor;
   - cole o Client ID e o Client secret;
   - salve.
2. **Authentication → URL Configuration → Redirect URLs**, adicione as duas:
   - `patinha://**`
   - `exp://**`
3. **Site URL:** pode ficar `patinha://auth`.
4. Rode **Actions → db-dev → Run workflow** para aplicar a migration de `profiles` no `patinha-dev`.

Em produção (Fase 15), o projeto de produção do Supabase só precisa de `patinha://**`, porque o Expo Go não é usado lá.

### 3. Supabase local (opcional)

O `supabase/config.toml` já libera `patinha://**` e `exp://**` em `additional_redirect_urls`. Para testar o Google contra o banco local:

1. Adicione o bloco abaixo ao `config.toml`, sem commitar os valores:
   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
   secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
   ```
2. No cliente do Google, cadastre o callback `http://127.0.0.1:54321/auth/v1/callback`.

Para o dia a dia local, o "Entrar como teste" (abaixo) é mais simples.

## Login de teste (só desenvolvimento)

O Maestro não consegue passar pelo login do Google. Por isso existe o botão **"Entrar como teste"**.

**Quando o botão aparece:**
- só em desenvolvimento (`__DEV__`);
- e só com `EXPO_PUBLIC_DEV_LOGIN=true` no `.env`.

Builds e EAS Updates de preview e produção são empacotados com `__DEV__ = false`, então o botão nunca aparece neles. O teste `src/features/auth/__tests__/devLogin.test.ts` garante isso e também que nenhum perfil do EAS nem workflow define a variável.

**Usuário de teste:**
- `teste@patinha.local`, criado por `supabase/dev/usuario-teste.sql`;
- existe **só no Supabase local**, aplicado por `make db-reset` (ou `make db-dev-login`);
- fica fora do `supabase/seed.sql` porque o workflow `db-dev` pode rodar o seed no `patinha-dev`, e uma senha conhecida não pode existir em banco na nuvem.

## Rodar o Maestro (`.maestro/login.yaml`)

1. `make db-up` e depois `make db-reset`. O reset recria o usuário de teste sem o onboarding feito.
2. No `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL=http://<IP do computador>:54321`;
   - a anon key local;
   - `EXPO_PUBLIC_DEV_LOGIN=true`.
3. `npx expo start` com o celular ou emulador na mesma rede e o Expo Go instalado.
4. `maestro test -e EXPO_URL=exp://<IP do computador>:8081 .maestro/login.yaml`.

O fluxo cobre:
- entrar;
- o onboarding (o botão não segue sem 18+);
- fechar e abrir o app logado;
- Perfil → Sair → tela de entrada.
