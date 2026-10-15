---
name: licao-adestramento
description: Escreve, revisa e valida o conteúdo de adestramento do Patinha — exercícios (passos, níveis 1–4, dicas, nota de segurança, vídeo), programas (sequência de dias por objetivo, como xixi, guia, latido, mordida, chamado, filhote, truques) e desafios do mês — no formato JSON de content/, com as regras de reforço positivo, a triagem de casos graves e o roteiro de revisão pelo adestrador parceiro. Use esta skill SEMPRE que o pedido envolver criar ou editar exercício, lição, aula, truque, programa, plano de treino, desafio, roteiro de vídeo de aula, conteúdo de adestramento, ou validar/importar a pasta content/, mesmo que o usuário não fale "skill".
---

# Lição de adestramento

O conteúdo **é** o produto. Um app bonito com lições confusas ou inseguras não retém ninguém, e uma lição que sugere punição pode machucar um cão. Esta skill garante que toda lição:
- **é clara para um tutor leigo** (passos curtos, um por vez);
- **é segura** (só reforço positivo, com triagem de casos graves);
- **progride em 4 níveis verificáveis**, que o app usa para subir de nível;
- **está no formato que o importador e o app esperam;**
- **passou pelo adestrador parceiro** antes de ser publicada.

**Você escreve o rascunho; quem aprova é o adestrador.** Todo item que você criar sai com `"published": false` e `"reviewed_by": null`, e só ele pode mudar isso.

Leia antes: `AGENTS.md`, o ADR-04 e o ADR-07 do `docs/roadmap.md` e `references/esquema-e-escrita.md` (o formato completo e o guia de escrita).

## Passo 1 — Entender o pedido
- **O quê:** exercício novo, programa novo, desafio do mês, ajuste de texto ou roteiro de vídeo.
- **Para quem:** idade mínima (`min_age_weeks`), porte e energia, quando fizer diferença.
- **Objetivo** (`goal_code`): `xixi`, `guia`, `latido`, `mordida`, `pular`, `chamado`, `sozinho`, `truques` ou `filhote`.
- **É Premium?** Programas de comportamento costumam ser Premium. Fundamentos e truques básicos são grátis.

## Passo 2 — Checar se o pedido é seguro para o app

**Não escreva plano automático** para:
- agressividade com mordida que machuca;
- ansiedade de separação grave (o cão se machuca ou destrói portas);
- medo extremo;
- mudança brusca de comportamento, que pode ser dor.

Para esses casos, o app mostra a triagem (ADR-07). O máximo que você escreve é um **texto de orientação** recomendando um adestrador presencial ou um veterinário comportamentalista.

**Proibido em qualquer lição:**
- enforcador, coleira de choque, borrifador como punição;
- bronca, castigo, "esfregar o focinho";
- "dominância" ou "ser o alfa";
- puxões na guia;
- privar de água ou comida para treinar;
- promessa de resultado garantido.

## Passo 3 — Escrever no formato

Siga `references/esquema-e-escrita.md`. Em resumo:
- **Exercício** (`content/exercicios/<slug>.json`):
  - `steps` com de 3 a 6 passos curtos (até ~140 caracteres cada, verbo no imperativo);
  - `levels` com **exatamente 4 níveis**, cada um com um critério observável ("senta 3 vezes seguidas sem o petisco na mão");
  - `tips` para quando dá "Ainda não";
  - `safety_note`;
  - `duration_min`, `min_age_weeks`, `video_url` (pode ficar null no rascunho), `is_premium`, `published: false` e `reviewed_by: null`.
- **Programa** (`content/programas/<slug>.json`): `days` com 2 a 4 exercícios por dia e `target_level`, progressão gradual e revisão a cada 3 ou 4 dias.
- **Desafio** (`content/desafios/<AAAA-MM>.json`): o mês, o título, o exercício ligado e se é Premium.

## Passo 4 — Roteiro do vídeo (quando pedido)

Cada exercício tem um vídeo de **30 a 60 s**, gravado pelo adestrador:
- **0–5 s:** o resultado final (o cão fazendo);
- **5–45 s:** os passos do nível 1, com o petisco e o clicker visíveis;
- **45–60 s:** o erro mais comum e como evitar.

Grave na horizontal **e** na vertical (ou só vertical, 9:16), com luz natural, sem música com letra e com legenda em português queimada no vídeo (muita gente assiste sem som).

**Nome do arquivo:** `<slug>-v<n>.mp4` (H.264, 720p, até 15 MB). Ele vai para o R2 e o `video_url` aponta para lá.

## Passo 5 — Validar

```bash
python <caminho-da-skill>/scripts/validar_conteudo.py content/
```

O validador confere:
- o esquema e os tipos;
- slugs únicos e referências existentes;
- 4 níveis por exercício;
- os limites de tamanho;
- os termos proibidos;
- a coerência de idade entre programa e exercício;
- e, para itens `published: true`, `reviewed_by`, `reviewed_at` e `video_url` preenchidos.

Corrija todos os ❌; os ⚠️ precisam de justificativa. O CI roda o mesmo script.

## Passo 6 — Revisão do adestrador

Gere o roteiro de revisão com `--roteiro`:
```bash
python <caminho-da-skill>/scripts/validar_conteudo.py content/ --roteiro > revisao.md
```

O resultado é um checklist por item:
- o método está correto?
- os passos estão claros?
- os critérios de nível são observáveis?
- a segurança está ok?
- a idade mínima está certa?
- o vídeo bate com o texto?

O adestrador marca cada item. Com o ok dele, preencha `reviewed_by` (nome) e `reviewed_at` (data) e, se ele autorizar, `published: true`. **Nunca preencha `reviewed_by` sem o ok real dele.**

## Passo 7 — Importar

Depois do merge, rode o `npm run content:import` (dev) ou o workflow de produção, conforme `docs/conteudo.md`. A Edge Function `import-content` faz o upsert por slug numa transação.

## Formato da entrega
- A lista dos arquivos criados ou alterados.
- A saída do validador.
- O roteiro de revisão para o adestrador.
- Os vídeos que faltam gravar, com o roteiro de cada um.
