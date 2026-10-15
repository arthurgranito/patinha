# Esquema do conteúdo e guia de escrita — Patinha

## Sumário
1. Exercício (`content/exercicios/<slug>.json`)
2. Programa (`content/programas/<slug>.json`)
3. Desafio do mês (`content/desafios/<AAAA-MM>.json`)
4. Guia de escrita
5. Os 4 níveis: como escrever critérios observáveis
6. Catálogo inicial sugerido

---

## 1. Exercício

```json
{
  "slug": "senta",
  "title": "Senta",
  "category": "obediencia",
  "goal_codes": ["filhote", "pular", "truques"],
  "summary": "O comando base para quase tudo: cumprimentar sem pular, esperar a comida, atravessar a rua.",
  "steps": [
    "Segure um petisco perto do focinho do seu cão.",
    "Leve o petisco devagar para cima e para trás, por cima da cabeça.",
    "Quando o bumbum encostar no chão, clique e dê o petisco na hora.",
    "Repita 5 vezes e faça uma pausa para brincar."
  ],
  "levels": [
    { "n": 1, "nome": "Com o petisco guiando", "criterio": "Senta 3 vezes seguidas seguindo o petisco." },
    { "n": 2, "nome": "Só com o gesto", "criterio": "Senta com o gesto da mão vazia, petisco só depois do clique." },
    { "n": 3, "nome": "Com a palavra e distração", "criterio": "Senta com a palavra 'senta' com alguém andando pela sala." },
    { "n": 4, "nome": "Em qualquer lugar", "criterio": "Senta com a palavra na calçada ou na casa de outra pessoa." }
  ],
  "tips": [
    "Se ele pula atrás do petisco, mantenha a mão mais baixa, quase encostando no focinho.",
    "Treine antes da refeição: com um pouco de fome, a atenção é maior."
  ],
  "safety_note": "Use petiscos pequenos (do tamanho de uma ervilha) e desconte da ração do dia.",
  "duration_min": 3,
  "min_age_weeks": 8,
  "is_premium": false,
  "video_url": null,
  "published": false,
  "reviewed_by": null,
  "reviewed_at": null
}
```

| Campo | Regra |
|---|---|
| `slug` | minúsculas, números e hífen; único; igual ao nome do arquivo |
| `title` | 2–40 caracteres |
| `category` | `obediencia` · `comportamento` · `truque` · `enriquecimento` |
| `goal_codes` | 1+ de `xixi`, `guia`, `latido`, `mordida`, `pular`, `chamado`, `sozinho`, `truques`, `filhote` |
| `summary` | 20–200 caracteres; para que serve no dia a dia |
| `steps` | 3–6 itens, cada um com 10–140 caracteres, no imperativo |
| `levels` | **exatamente 4**, `n` de 1 a 4, com `nome` (até 40) e `criterio` (até 160, observável) |
| `tips` | 1–4 itens, cada um com até 160 caracteres |
| `safety_note` | 10–200 caracteres |
| `duration_min` | 1–10 |
| `min_age_weeks` | 8–104 |
| `video_url` | `null` ou uma URL https do R2 terminando em `.mp4` |
| `published` | `true` exige `reviewed_by`, `reviewed_at` (AAAA-MM-DD) e `video_url` |

## 2. Programa

```json
{
  "slug": "guia-sem-puxar",
  "title": "Passeio sem puxar",
  "goal_code": "guia",
  "summary": "Em 3 semanas, passeios mais tranquilos com guia frouxa.",
  "weeks": 3,
  "min_age_weeks": 16,
  "is_premium": true,
  "days": [
    { "day": 1, "items": [ { "exercise": "olha-pra-mim", "target_level": 1 }, { "exercise": "guia-frouxa-em-casa", "target_level": 1 } ] },
    { "day": 2, "items": [ { "exercise": "olha-pra-mim", "target_level": 2 }, { "exercise": "guia-frouxa-em-casa", "target_level": 1 } ] }
  ],
  "published": false,
  "reviewed_by": null,
  "reviewed_at": null
}
```

| Campo | Regra |
|---|---|
| `goal_code` | um dos objetivos acima |
| `weeks` | 1–8; `days` deve ter de `weeks*5` a `weeks*7` dias, numerados a partir de 1, sem buracos |
| `days[].items` | 1–4 itens; `exercise` precisa existir; `target_level` de 1 a 4 |
| Progressão | o `target_level` de um exercício nunca cai mais de 1 de um dia para o outro |
| Idade | o `min_age_weeks` do programa ≥ o maior `min_age_weeks` dos exercícios usados |
| Tempo | a soma de `duration_min` do dia ≤ 15 |

## 3. Desafio do mês

```json
{
  "month": "2027-03",
  "title": "Mês do Dá a Pata",
  "summary": "Ensine seu cão a dar a pata até o fim do mês e ganhe a conquista do desafio.",
  "exercise": "da-a-pata",
  "is_premium": false,
  "published": false
}
```

## 4. Guia de escrita

- **Um passo = uma ação.** "Segure o petisco perto do focinho", e não "segure o petisco e leve para cima enquanto fala o comando".
- **Verbo no imperativo**, na 2ª pessoa informal ("segure", "espere", "clique").
- **Diga quando recompensar:** "no instante em que…, clique e dê o petisco".
- **Sessões curtas:** de 3 a 5 repetições, depois pausa ou brincadeira. Termine sempre com um acerto.
- **Linguagem gentil:** "ainda está aprendendo", "volte um nível", nunca "teimoso" nem "desobediente".
- **Realidade brasileira:** apartamento, quintal, porteiro, interfone, calor (passeio fora do horário quente), fogos.
- **Sem jargão sem explicação:** se usar "marcador" ou "reforço", explique em meia frase.
- **Nada de promessa de prazo.** "Muitos cães aprendem em alguns dias; cada um tem seu tempo."

## 5. Os 4 níveis: critérios observáveis

| Nível | Ideia | Exemplo de critério observável |
|---|---|---|
| 1 | Aprender com ajuda (petisco guiando) | "faz 3 vezes seguidas seguindo o petisco" |
| 2 | Sem a isca (gesto ou palavra, petisco depois) | "faz com a mão vazia, petisco só depois do clique" |
| 3 | Com distração ou duração | "faz com alguém passando" / "fica 10 segundos" |
| 4 | Generalizado (outros lugares e pessoas) | "faz na calçada" / "faz quando outra pessoa pede" |

O app sobe de nível depois de **3 "Conseguiu!" seguidos**, então o critério precisa ser algo que o tutor consiga julgar sozinho, com sim ou não.

## 6. Catálogo inicial sugerido (MVP)

**Fundamentos (grátis):**
- `olha-pra-mim`
- `nome`
- `senta`
- `deita`
- `vem` (chamado em casa)
- `troca` (largar objeto)
- `tapetinho` (ir para o lugar)

**Problemas (Premium):**
- `xixi-no-lugar-certo` (rotina, sem punição)
- `guia-frouxa-em-casa` → `guia-frouxa-na-rua`
- `nao-pular-cumprimentando`
- `mordida-de-brincadeira` (filhote)
- `interfone-tapetinho`
- `ficar-sozinho-um-pouco` (só casos leves)

**Truques (parte grátis, parte Premium):**
- `da-a-pata`
- `toca-aqui`
- `rola`
- `finge-de-morto`
- `gira`
- `pede`

**Programas:**
- `fundamentos` (grátis, 2 semanas)
- `filhote-comecando-certo`
- `xixi-no-lugar-certo`
- `guia-sem-puxar`
- `cumprimento-educado`
- `truques-para-impressionar`
