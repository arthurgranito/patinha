-- SÓ PARA O SUPABASE LOCAL. Usuário do botão "Entrar como teste" (Maestro, .maestro/login.yaml).
-- Fica fora do supabase/seed.sql de propósito: o workflow db-dev roda o seed no patinha-dev
-- com --include-seed, e uma senha conhecida não pode existir em banco na nuvem.
-- Aplicado por `make db-reset` / `make db-dev-login`. Idempotente.
do $$
declare
  v_id uuid := '00000000-0000-4000-8000-00000000d0e1';
begin
  if exists (select 1 from auth.users where id = v_id) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    'teste@patinha.local', extensions.crypt('patinha-teste', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{"full_name": "Tutor Teste"}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', 'teste@patinha.local', 'email_verified', true),
    now(), now(), now()
  );
end;
$$;
