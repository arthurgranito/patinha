-- Seeds de desenvolvimento (rodam no `supabase db reset` e, se marcado, no workflow db-dev).
-- NUNCA rode em produção: publica conteúdo de EXEMPLO (reviewed_by = 'EXEMPLO - substituir'),
-- que não passou pela revisão do adestrador. O workflow de produção (Fase 15) não tem seed.
-- Idempotente: ids fixos e `on conflict do nothing`; as sessões só são criadas uma vez.
--
-- Conteúdo:
--   * 2 tutores sem senha (não fazem login): Ana (grátis) e Bruno (Premium);
--   * 3 cães: Caramelo (vira-lata filhote, Ana), Thor (adulto grande, Bruno) e Pipoca (idosa pequena, Bruno);
--   * 8 exercícios e 2 programas de EXEMPLO (Fundamentos grátis, Passeio sem puxar Premium);
--   * 2 semanas de sessões com um buraco (a sequência atual do Caramelo e do Thor é de 5 dias).

-- ---------------------------------------------------------------------------------------
-- Tutores
-- ---------------------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated',
   'ana@seed.patinha.local', now(), '{"provider": "google", "providers": ["google"]}', '{"full_name": "Ana Exemplo"}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated',
   'bruno@seed.patinha.local', now(), '{"provider": "google", "providers": ["google"]}', '{"full_name": "Bruno Exemplo"}',
   now(), now(), '', '', '', '')
on conflict (id) do nothing;

update public.profiles
   set is_adult_confirmed = true, adult_confirmed_at = coalesce(adult_confirmed_at, now())
 where id in ('a0000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-0000000000b2');

insert into public.entitlements (user_id, status, expires_at, store, product_id)
values ('b0000000-0000-4000-8000-0000000000b2', 'ativo', now() + interval '1 year', 'play_store', 'patinha_premium_anual')
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------------------
-- Cães
-- ---------------------------------------------------------------------------------------
insert into public.dogs (id, owner_id, name, birth_month, size, breed, is_srd, energy, daily_minutes) values
  ('d0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-0000000000a1', 'Caramelo',
   date_trunc('month', current_date - interval '4 months')::date, 'medio', null, true, 'alta', 10),
  ('d0000000-0000-4000-8000-00000000000d', 'b0000000-0000-4000-8000-0000000000b2', 'Thor',
   date_trunc('month', current_date - interval '4 years')::date, 'grande', 'Labrador', false, 'media', 15),
  ('d0000000-0000-4000-8000-00000000000e', 'b0000000-0000-4000-8000-0000000000b2', 'Pipoca',
   date_trunc('month', current_date - interval '11 years')::date, 'pequeno', 'Shih-tzu', false, 'baixa', 5)
on conflict (id) do nothing;

insert into public.dog_goals (dog_id, goal_code, flagged_severe) values
  ('d0000000-0000-4000-8000-00000000000c', 'filhote', false),
  ('d0000000-0000-4000-8000-00000000000c', 'mordida', false),
  ('d0000000-0000-4000-8000-00000000000d', 'guia', false),
  ('d0000000-0000-4000-8000-00000000000d', 'pular', false),
  ('d0000000-0000-4000-8000-00000000000e', 'truques', false),
  ('d0000000-0000-4000-8000-00000000000e', 'sozinho', true)
on conflict do nothing;

update public.profiles set active_dog_id = 'd0000000-0000-4000-8000-00000000000c'
 where id = 'a0000000-0000-4000-8000-0000000000a1' and active_dog_id is null;
update public.profiles set active_dog_id = 'd0000000-0000-4000-8000-00000000000d'
 where id = 'b0000000-0000-4000-8000-0000000000b2' and active_dog_id is null;

-- ---------------------------------------------------------------------------------------
-- Conteúdo de EXEMPLO (os 4 primeiros espelham content/exercicios)
-- ---------------------------------------------------------------------------------------
insert into public.exercises (
  id, slug, title, category, goal_codes, summary, steps, levels, tips, safety_note,
  video_url, duration_min, min_age_weeks, is_premium, published, reviewed_by
) values
  ('e0000000-0000-4000-8000-000000000001', 'olha-pra-mim', 'Olha pra mim', 'obediencia', '{filhote,guia,latido}',
   'Ensina o cão a buscar seu olhar. É a base para passear sem puxar e para acalmar em situações agitadas.',
   '["Fique em um lugar calmo, com petiscos pequenos na mão fechada.", "Espere em silêncio até o seu cão olhar para o seu rosto.", "No instante em que ele olhar nos seus olhos, clique e dê o petisco.", "Repita 5 vezes e termine com uma brincadeira."]',
   '[{"n": 1, "nome": "Olhar espontâneo", "criterio": "Olha para o seu rosto 3 vezes em 1 minuto, sem você chamar."}, {"n": 2, "nome": "Com o nome", "criterio": "Olha para você quando ouve o nome, 3 vezes seguidas."}, {"n": 3, "nome": "Com distração", "criterio": "Olha para você com o nome mesmo com um brinquedo no chão."}, {"n": 4, "nome": "Na rua", "criterio": "Olha para você com o nome na calçada, com gente passando."}]',
   '["Se ele não olha, fique mais perto e mais baixo, na altura dele.", "Comece com o cão um pouco cansado, depois de um passeio curto."]',
   'Nunca force o olhar segurando o focinho. O olhar precisa ser escolha do cão.',
   'https://videos.exemplo.patinha.app/exemplo/olha-pra-mim-v1.mp4', 3, 8, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000002', 'senta', 'Senta', 'obediencia', '{filhote,pular,truques}',
   'O comando base para quase tudo: cumprimentar sem pular, esperar a comida, atravessar a rua.',
   '["Segure um petisco perto do focinho do seu cão.", "Leve o petisco devagar para cima e para trás, por cima da cabeça.", "Quando o bumbum encostar no chão, clique e dê o petisco na hora.", "Repita 5 vezes e faça uma pausa para brincar."]',
   '[{"n": 1, "nome": "Com o petisco guiando", "criterio": "Senta 3 vezes seguidas seguindo o petisco."}, {"n": 2, "nome": "Só com o gesto", "criterio": "Senta com o gesto da mão vazia, petisco só depois do clique."}, {"n": 3, "nome": "Com a palavra e distração", "criterio": "Senta com a palavra ''senta'' com alguém andando pela sala."}, {"n": 4, "nome": "Em qualquer lugar", "criterio": "Senta com a palavra na calçada ou na casa de outra pessoa."}]',
   '["Se ele pula atrás do petisco, mantenha a mão mais baixa, quase encostando no focinho.", "Treine antes da refeição: com um pouco de fome, a atenção é maior."]',
   'Use petiscos pequenos (do tamanho de uma ervilha) e desconte da ração do dia.',
   'https://videos.exemplo.patinha.app/exemplo/senta-v1.mp4', 3, 8, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000003', 'deita', 'Deita', 'obediencia', '{filhote,latido,truques}',
   'Ajuda o cão a se acalmar e a esperar. Ótimo para quando chega visita ou na hora da sua refeição.',
   '["Peça o senta e segure um petisco perto do focinho.", "Leve o petisco devagar até o chão, entre as patas da frente.", "Quando os cotovelos encostarem no chão, clique e dê o petisco.", "Repita 4 vezes e termine com um carinho."]',
   '[{"n": 1, "nome": "Com o petisco guiando", "criterio": "Deita 3 vezes seguidas seguindo o petisco até o chão."}, {"n": 2, "nome": "Só com o gesto", "criterio": "Deita com a mão vazia apontando o chão, petisco depois do clique."}, {"n": 3, "nome": "Com duração", "criterio": "Fica deitado 10 segundos antes do clique."}, {"n": 4, "nome": "Com a palavra, fora de casa", "criterio": "Deita com a palavra ''deita'' no quintal ou na calçada."}]',
   '["Se ele levanta o bumbum, leve o petisco mais devagar e mais perto das patas.", "Treine em um tapete: o chão frio ou liso incomoda alguns cães."]',
   'Cães idosos ou com dor nas articulações podem ter dificuldade: respeite o tempo e consulte o veterinário se notar dor.',
   'https://videos.exemplo.patinha.app/exemplo/deita-v1.mp4', 3, 10, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000004', 'da-a-pata', 'Dá a pata', 'truque', '{truques}',
   'O truque clássico que todo mundo ama. Ótimo para fortalecer a relação e para fotos no story.',
   '["Peça o senta e feche um petisco na mão, perto do peito dele.", "Espere: ele vai cheirar, lamber e, em algum momento, levantar a pata.", "Quando a pata encostar na sua mão, clique e dê o petisco.", "Repita 5 vezes; depois ofereça a mão aberta e vazia."]',
   '[{"n": 1, "nome": "Pata na mão fechada", "criterio": "Encosta a pata na mão fechada 3 vezes seguidas."}, {"n": 2, "nome": "Mão aberta", "criterio": "Coloca a pata na mão aberta e vazia, petisco depois do clique."}, {"n": 3, "nome": "Com a palavra", "criterio": "Dá a pata quando você diz ''pata'', sem mostrar a mão antes."}, {"n": 4, "nome": "Com outras pessoas", "criterio": "Dá a pata 3 vezes seguidas quando outra pessoa da casa ou uma visita pede."}]',
   '["Se ele não levanta a pata, toque de leve atrás da pata e recompense o menor movimento.", "Sessões de 3 minutos: truque cansa a cabeça mais do que parece."]',
   'Se o cão evita usar uma pata ou demonstra dor ao levantá-la, pare e consulte o veterinário.',
   'https://videos.exemplo.patinha.app/exemplo/da-a-pata-v1.mp4', 3, 12, true, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000005', 'atende-pelo-nome', 'Atende pelo nome', 'obediencia', '{filhote,chamado}',
   'Faz o nome do cão virar sinal de coisa boa. É o primeiro passo para ele vir quando você chama.',
   '["Em casa, sem distrações, diga o nome do cão uma vez, num tom alegre.", "Quando ele virar a cabeça para você, clique e dê o petisco.", "Espere ele se distrair um pouco e repita.", "Faça 5 repetições e encerre com carinho."]',
   '[{"n": 1, "nome": "Pertinho e sem distração", "criterio": "Vira para você 3 vezes seguidas quando ouve o nome, a 1 metro."}, {"n": 2, "nome": "De outro cômodo", "criterio": "Vira ou vem quando ouve o nome de outro cômodo, 3 vezes seguidas."}, {"n": 3, "nome": "Com distração", "criterio": "Vira para você com o nome mesmo com um brinquedo por perto."}, {"n": 4, "nome": "No quintal ou na rua", "criterio": "Vira para você com o nome no quintal ou na calçada, 3 vezes seguidas."}]',
   '["Use o nome só para coisas boas; para chamar a atenção em momentos chatos, use outro som.", "Se ele não vira, diminua a distância e use um petisco mais gostoso."]',
   'Diga o nome uma vez só e em tom alegre: repetir sem parar ensina o cão a ignorar.',
   'https://videos.exemplo.patinha.app/exemplo/atende-pelo-nome-v1.mp4', 3, 8, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000006', 'vem-aqui', 'Vem aqui', 'obediencia', '{chamado,filhote}',
   'Ensina o cão a vir até você com alegria quando é chamado, começando dentro de casa.',
   '["Com o cão a 2 passos, diga ''vem'' num tom animado e dê um passo para trás.", "Quando ele chegar perto, clique e dê o petisco junto ao seu corpo.", "Faça festa com a voz para ele querer voltar sempre.", "Repita 5 vezes, aumentando a distância aos poucos."]',
   '[{"n": 1, "nome": "Pertinho", "criterio": "Vem até você 3 vezes seguidas de 2 passos de distância."}, {"n": 2, "nome": "Do outro lado da sala", "criterio": "Vem até você do outro lado da sala, 3 vezes seguidas."}, {"n": 3, "nome": "Com distração", "criterio": "Vem até você mesmo com um brinquedo no chão, 3 vezes seguidas."}, {"n": 4, "nome": "No quintal ou na praça", "criterio": "Vem até você no quintal ou na praça, com guia longa, 3 vezes seguidas."}]',
   '["Nunca chame para algo que ele não gosta, como banho ou ir embora do parque.", "Agache e abra os braços: fica mais convidativo para o cão."]',
   'Fora de casa, treine sempre em local cercado ou com guia longa presa à peitoral.',
   'https://videos.exemplo.patinha.app/exemplo/vem-aqui-v1.mp4', 4, 8, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000007', 'fica', 'Fica', 'obediencia', '{pular,guia,filhote}',
   'Ensina o cão a esperar parado por alguns segundos. Ajuda na porta, no portão e na hora da comida.',
   '["Peça o senta e mostre a palma da mão aberta.", "Espere 1 segundo, clique e dê o petisco sem que ele se mexa.", "Aos poucos, aumente o tempo de espera, um segundo por vez.", "Libere com uma palavra como ''pode'' e faça festa."]',
   '[{"n": 1, "nome": "Alguns segundos", "criterio": "Fica sentado 3 segundos com você na frente, 3 vezes seguidas."}, {"n": 2, "nome": "Com um passo", "criterio": "Fica sentado enquanto você dá um passo para trás e volta."}, {"n": 3, "nome": "Mais tempo", "criterio": "Fica sentado 15 segundos com você a 2 passos de distância."}, {"n": 4, "nome": "Na porta", "criterio": "Fica sentado com a porta aberta até você liberar, 3 vezes seguidas."}]',
   '["Volte até o cão para dar o petisco: assim ele aprende que ficar parado vale a pena.", "Aumente uma coisa por vez: ou o tempo, ou a distância, ou a distração."]',
   'Treine a porta aberta só com portão ou grade fechada atrás, para o cão ficar em segurança.',
   'https://videos.exemplo.patinha.app/exemplo/fica-v1.mp4', 4, 12, false, true, 'EXEMPLO - substituir'),
  ('e0000000-0000-4000-8000-000000000008', 'andar-junto', 'Andar junto', 'comportamento', '{guia}',
   'Ensina o cão a andar ao seu lado com a guia frouxa, recompensando cada passo na posição certa.',
   '["Em casa, com a guia presa na peitoral, segure petiscos na mão do lado do cão.", "Dê um passo; se ele acompanhar ao seu lado, clique e dê o petisco junto à sua perna.", "Se ele for na frente, pare e espere ele voltar para o seu lado.", "Faça 5 minutos e encerre com uma brincadeira."]',
   '[{"n": 1, "nome": "Em casa", "criterio": "Anda 5 passos ao seu lado com a guia frouxa, 3 vezes seguidas."}, {"n": 2, "nome": "No quintal ou corredor", "criterio": "Anda 10 passos ao seu lado com a guia frouxa no quintal."}, {"n": 3, "nome": "Na calçada calma", "criterio": "Anda meio quarteirão com a guia frouxa numa rua tranquila."}, {"n": 4, "nome": "Com distração", "criterio": "Anda um quarteirão com a guia frouxa com gente e cães passando."}]',
   '["Leve petiscos bem pequenos: você vai usar muitos no começo.", "Passeios curtos e frequentes funcionam melhor do que um passeio longo."]',
   'Use peitoral bem ajustada. Se o cão mancar, ofegar demais ou parar de andar, encerre e procure o veterinário.',
   'https://videos.exemplo.patinha.app/exemplo/andar-junto-v1.mp4', 5, 16, true, true, 'EXEMPLO - substituir')
on conflict (id) do nothing;

insert into public.programs (id, slug, title, summary, goal_code, weeks, min_age_weeks, is_premium, published, reviewed_by, sort) values
  ('f0000000-0000-4000-8000-000000000001', 'fundamentos', 'Fundamentos',
   'A base de tudo: atenção, nome, senta e deita, em sessões curtas de poucos minutos por dia.',
   'filhote', 2, 8, false, true, 'EXEMPLO - substituir', 1),
  ('f0000000-0000-4000-8000-000000000002', 'passeio-sem-puxar', 'Passeio sem puxar',
   'Do olhar ao andar junto: passo a passo para passear com a guia frouxa.',
   'guia', 2, 16, true, true, 'EXEMPLO - substituir', 2)
on conflict (id) do nothing;

-- Fundamentos: 10 dias (olha-pra-mim, atende-pelo-nome, senta, deita).
insert into public.program_items (program_id, day_index, position, exercise_id, target_level)
select 'f0000000-0000-4000-8000-000000000001', d.day_index, d.position, e.id, d.target_level
  from (values
    (1, 1, 'olha-pra-mim', 1), (1, 2, 'atende-pelo-nome', 1),
    (2, 1, 'olha-pra-mim', 1), (2, 2, 'senta', 1),
    (3, 1, 'atende-pelo-nome', 1), (3, 2, 'senta', 1), (3, 3, 'deita', 1),
    (4, 1, 'olha-pra-mim', 2), (4, 2, 'senta', 2),
    (5, 1, 'atende-pelo-nome', 2), (5, 2, 'deita', 1),
    (6, 1, 'senta', 2), (6, 2, 'deita', 2),
    (7, 1, 'olha-pra-mim', 3), (7, 2, 'atende-pelo-nome', 2),
    (8, 1, 'senta', 3), (8, 2, 'deita', 2),
    (9, 1, 'olha-pra-mim', 3), (9, 2, 'atende-pelo-nome', 3), (9, 3, 'senta', 3),
    (10, 1, 'deita', 3), (10, 2, 'senta', 3)
  ) as d (day_index, position, slug, target_level)
  join public.exercises e on e.slug = d.slug
on conflict do nothing;

-- Passeio sem puxar (Premium): 10 dias (olha-pra-mim, fica, andar-junto).
insert into public.program_items (program_id, day_index, position, exercise_id, target_level)
select 'f0000000-0000-4000-8000-000000000002', d.day_index, d.position, e.id, d.target_level
  from (values
    (1, 1, 'olha-pra-mim', 1), (1, 2, 'andar-junto', 1),
    (2, 1, 'fica', 1), (2, 2, 'andar-junto', 1),
    (3, 1, 'olha-pra-mim', 2), (3, 2, 'andar-junto', 1),
    (4, 1, 'fica', 2), (4, 2, 'andar-junto', 2),
    (5, 1, 'olha-pra-mim', 2), (5, 2, 'andar-junto', 2),
    (6, 1, 'fica', 2), (6, 2, 'andar-junto', 2),
    (7, 1, 'olha-pra-mim', 3), (7, 2, 'andar-junto', 3),
    (8, 1, 'fica', 3), (8, 2, 'andar-junto', 3),
    (9, 1, 'olha-pra-mim', 3), (9, 2, 'andar-junto', 3),
    (10, 1, 'fica', 3), (10, 2, 'andar-junto', 4)
  ) as d (day_index, position, slug, target_level)
  join public.exercises e on e.slug = d.slug
on conflict do nothing;

-- Planos dos cães (começaram há 2 semanas, no dia lógico do tutor).
insert into public.dog_programs (id, dog_id, program_id, started_on, current_day, status) values
  ('c0000000-0000-4000-8000-00000000000c', 'd0000000-0000-4000-8000-00000000000c', 'f0000000-0000-4000-8000-000000000001',
   public.user_day('a0000000-0000-4000-8000-0000000000a1') - 14, 1, 'ativo'),
  ('c0000000-0000-4000-8000-00000000000d', 'd0000000-0000-4000-8000-00000000000d', 'f0000000-0000-4000-8000-000000000002',
   public.user_day('b0000000-0000-4000-8000-0000000000b2') - 14, 1, 'ativo'),
  ('c0000000-0000-4000-8000-00000000000e', 'd0000000-0000-4000-8000-00000000000e', 'f0000000-0000-4000-8000-000000000001',
   public.user_day('b0000000-0000-4000-8000-0000000000b2') - 14, 1, 'ativo')
on conflict (id) do nothing;

insert into public.app_config (key, value) values ('maintenance', 'false')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------------------
-- Sessões: 2 semanas (de 14 dias atrás até ontem), passando pelos triggers de verdade.
-- O buraco fica 6 dias atrás; hoje fica sem treino, para a tela Hoje ter o que mostrar.
-- Cada dia faz os itens do dia atual do programa; o resultado segue um padrão fixo
-- (maioria "conseguiu", alguns "quase" e "ainda_nao").
-- ---------------------------------------------------------------------------------------
do $$
declare
  v_cao record;
  v_item record;
  v_hoje date;
  v_dia date;
  v_n int;
  v_dia_programa int;
  v_status text;
begin
  if exists (select 1 from public.training_sessions where dog_id = 'd0000000-0000-4000-8000-00000000000c') then
    return;
  end if;

  for v_cao in
    select * from (values
      ('d0000000-0000-4000-8000-00000000000c'::uuid, 'a0000000-0000-4000-8000-0000000000a1'::uuid,
       'c0000000-0000-4000-8000-00000000000c'::uuid, array[6], 1),
      ('d0000000-0000-4000-8000-00000000000d'::uuid, 'b0000000-0000-4000-8000-0000000000b2'::uuid,
       'c0000000-0000-4000-8000-00000000000d'::uuid, array[6], 1),
      -- Pipoca treina dia sim, dia não (idosa, 5 min).
      ('d0000000-0000-4000-8000-00000000000e'::uuid, 'b0000000-0000-4000-8000-0000000000b2'::uuid,
       'c0000000-0000-4000-8000-00000000000e'::uuid, array[1, 3, 5, 6, 7, 9, 11, 13], 2)
    ) as t (dog_id, user_id, dog_program_id, buracos, passo)
  loop
    v_hoje := public.user_day(v_cao.user_id);
    for v_n in reverse 14..1 loop
      continue when v_n = any (v_cao.buracos);
      v_dia := v_hoje - v_n;

      -- Programa concluído: o resto dos dias vira treino livre de revisão (itens do dia 1).
      select dp.current_day, dp.status into v_dia_programa, v_status
        from public.dog_programs dp where dp.id = v_cao.dog_program_id;
      if v_status <> 'ativo' then
        v_dia_programa := 1;
      end if;

      for v_item in
        select pi.position, pi.exercise_id
          from public.program_items pi
          join public.dog_programs dp on dp.program_id = pi.program_id
         where dp.id = v_cao.dog_program_id and pi.day_index = v_dia_programa
         order by pi.position
      loop
        insert into public.training_sessions (dog_id, user_id, exercise_id, dog_program_id, result, duration_sec, done_at)
        values (
          v_cao.dog_id, v_cao.user_id, v_item.exercise_id,
          case when v_status = 'ativo' then v_cao.dog_program_id end,
          case
            when (v_n + v_item.position) % 7 = 0 then 'ainda_nao'
            when (v_n + v_item.position) % 5 = 0 then 'quase'
            else 'conseguiu'
          end,
          150 + 30 * v_item.position,
          ((v_dia + time '19:00') at time zone 'America/Sao_Paulo') + make_interval(mins => 4 * v_item.position)
        );
      end loop;
    end loop;
  end loop;

  -- Um treino livre do Thor (sem programa), anteontem.
  insert into public.training_sessions (dog_id, user_id, exercise_id, result, duration_sec, done_at)
  select 'd0000000-0000-4000-8000-00000000000d', 'b0000000-0000-4000-8000-0000000000b2', e.id, 'conseguiu', 120,
         ((public.user_day('b0000000-0000-4000-8000-0000000000b2') - 2 + time '20:30') at time zone 'America/Sao_Paulo')
    from public.exercises e where e.slug = 'da-a-pata';
end;
$$;
