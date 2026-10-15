# Patinha — adestramento positivo gamificado (resumo do projeto)

> "Patinha" é nome provisório. Confira a disponibilidade nas lojas, no INPI e no Instagram antes de registrar.

**Ideia:** app de celular (iOS e Android) que transforma o adestramento do cachorro em **treinos guiados de 5 a 15 minutos por dia**, como um Duolingo para o cão:
- o tutor cadastra o cachorro e os problemas que quer resolver;
- o app monta um plano;
- todo dia mostra o que treinar, com vídeo curto, passos e clicker;
- o tutor marca como foi, e o app ajusta o nível;
- conquistas e cards transformam o progresso em post.

**Restrições:** até R$ 200/mês · 5–15 h/semana · fundador solo · app nativo (Expo) · crescimento orgânico (Instagram e TikTok) · tutores adultos.

## Por que esta ideia
- **A categoria já prova que tutor paga.** O Dogo tem mais de 10 milhões de tutores e cobra no Brasil assinaturas de R$ 19,90 a R$ 399,90. Uma estimativa de terceiros coloca a receita dele em cerca de US$ 4 milhões por ano.
- **A dor é concreta e cara.** Xixi no lugar errado, puxar a guia, latido e mordida. Uma aula presencial custa, em média, de R$ 150 a R$ 200.
- **Existe brecha para um brasileiro de verdade.** Os líderes são gringos traduzidos, caros para o bolso brasileiro (até avaliações positivas do Dogo citam reclamações de preço) e não falam de vira-lata, apartamento, porteiro e fogos de Réveillon.
- **É instagramável por natureza.** Cachorro aprendendo truque é um dos conteúdos que mais rendem nas redes.

## O ciclo central
Lembrete às 19h → abre o treino do dia → assiste a 40 s de vídeo → treina 5 minutos com o clicker → marca "Conseguiu", "Quase" ou "Ainda não" → o app ajusta o nível → a sequência sobe → truque dominado vira card para o story.

## MVP — 5 funções
1. **Cadastro do cão:** foto, idade, porte, raça ou vira-lata, problemas e tempo por dia.
2. **Plano personalizado + treino do dia:** programas por objetivo (xixi, guia, latido, mordida, pular, chamado, truques), com níveis progressivos (com petisco → sem petisco → com distração → na rua).
3. **Sessão guiada:** vídeo curto do adestrador, passos, clicker e cronômetro, mais o resultado com adaptação automática.
4. **Gamificação:** sequência por cão, carteirinha de truques, conquistas e desafio do mês.
5. **Cards para o story:** "Caramelo aprendeu a dar a pata em 3 dias 🐾" e a carteirinha de truques.

## Monetização
- **Grátis:** cadastro, plano de introdução e truques básicos, o suficiente para criar o hábito e ver resultado.
- **Premium:** cerca de R$ 14,90/mês ou R$ 89,90/ano, com teste grátis de 7 dias. Inclui todos os programas de comportamento (é aí que o tutor paga, porque o problema dói), mais cães, desafios e temas de card.
- **Depois:** plano com correção por vídeo do adestrador, mais caro.
- **A conta:** a loja fica com 15% da assinatura no programa para pequenos desenvolvedores, e o RevenueCat é grátis até US$ 2.500 de receita mensal.

## O pilar que não é código: o adestrador parceiro
O conteúdo (vídeos, planos e níveis) precisa vir de um **adestrador brasileiro com método positivo**, em parceria por participação na receita. Isso resolve três coisas:
- **qualidade e segurança** do que o app ensina;
- **produção** dos vídeos;
- **distribuição:** a audiência do adestrador vira o primeiro público.

## Stack e custos
Expo (React Native + TypeScript) · Supabase (Postgres, RLS, Auth, Edge Functions) · Cloudflare R2 para os vídeos (sem taxa de saída) · RevenueCat para as assinaturas · EAS Build e Update.
- **Até o lançamento:** cerca de R$ 0 a 45/mês. A conta Apple (US$ 99/ano) só entra quando for testar no iPhone fora do Expo Go.
- **Depois do lançamento:** cerca de R$ 190/mês (Supabase Pro + Apple + domínio). Se ficar apertado, o Supabase grátis aguenta o começo.

## Riscos
- **O conteúdo é o produto.** Sem um adestrador parceiro, não lance.
- **Os concorrentes já falam português.** O diferencial precisa ser real: brasileiro, mais barato e mais divertido.
- **Bem-estar animal:** nada de punição. Casos de agressividade ou ansiedade grave vão para um profissional presencial ou um veterinário.
- **As regras das lojas** (login com Apple, exclusão de conta dentro do app, política de privacidade) atrasam quem deixa para o fim.

## Validação antes do código (2 semanas)
Veja `docs/validacao.md`. O critério para começar a construir:
- pelo menos **300 pessoas** na lista de espera;
- pelo menos **10% delas clicando em "Assinar"**;
- **1 adestrador** topando a parceria.
