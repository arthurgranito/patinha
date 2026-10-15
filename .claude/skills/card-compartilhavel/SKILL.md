---
name: card-compartilhavel
description: Cria, altera e depura os cards de story do Patinha (imagens 1080×1920 geradas no próprio app com react-native-view-shot e compartilhadas com expo-sharing) — truque dominado, sequência, conquista, carteirinha de truques, desafio concluído — incluindo paletas, temas Premium, a foto do cão e o pipeline de capturar, compartilhar e salvar na galeria. Use esta skill SEMPRE que o pedido envolver card, story, imagem para compartilhar, template visual, "algo pro tutor postar", carteirinha para compartilhar, ou problemas como card em branco, foto do cão que não aparece, fonte errada no PNG, compartilhar que não abre o Instagram ou card cortado no story — mesmo que o usuário não fale "card" explicitamente.
---

# Card compartilhável (React Native)

No Patinha, o card é o canal de crescimento: cada "Caramelo aprendeu a dar a pata" postado é um anúncio grátis com o cachorro mais fofo do bairro. Um card só funciona se:
- **o tutor sentir orgulho** do cachorro ao postar;
- **o cão for o protagonista** (foto e nome grandes; o app aparece pequeno);
- **ele chegar inteiro ao story.**

Antes de começar, leia `AGENTS.md`, o ADR-09 do `docs/roadmap.md`, os fluxos F27 e F28 do `docs/flows.md` e o código em `src/features/cards/`. Se o motor ainda não existir, use `references/motor-rn.md` como base. Ele compila com os tipos atuais do React Native.

## Passo 1 — Escrever o brief do card

Antes de desenhar, responda em 5 linhas:
1. **Momento:** quando ele aparece? Truque dominado, marco de 7/30/100 dias, conquista, desafio concluído ou a carteirinha.
2. **Dado herói:** o único fato do card. Por exemplo: "aprendeu a dar a pata", "🔥 30 dias treinando", "sabe 7 truques".
3. **Emoção:** orgulho, fofura, "olha o que ele aprendeu".
4. **Foto:** o card tem a foto do cão? (Quase sempre tem; sem foto, ilustração com a inicial.)
5. **Quem vê:** seguidores que não usam o app. O card precisa fazer sentido sozinho e despertar "quero ensinar isso pro meu".

Mostre o brief ao usuário quando for um template novo. Para ajuste pequeno, siga direto.

## Passo 2 — Seguir as regras de design

**O cão é o protagonista:**
- A foto ocupa a maior área do card, com moldura na cor de destaque.
- O nome do cão aparece em destaque.
- O app aparece só na marca discreta do rodapé.

**Tom e bem-estar animal:**
- Só celebração ("aprendeu", "dominou", "treinando há 30 dias").
- **Nunca:** "finalmente obedece", "parou de ser teimoso", comparações com outros cães, nem imagens de enforcador ou punição.
- **Cão que faleceu** ("O cão partiu 🌈", fluxo F12): **nunca** gere card dele.

**Medidas na unidade `u`** (largura ÷ 360; ver `references/motor-rn.md`):
- **Área segura:** 84 u em cima e embaixo; 24 u nas laterais.
- **Texto:** herói de 28 a 40 u, contexto de 16 a 22 u, detalhe de 12 a 14 u. **Nada abaixo de 10 u** (≈ 30 px na exportação).
- **Linhas e bordas:** pelo menos 1 u (≈ 3 px exportados).

**Texto em pt-BR:**
- **Plural certo:** "1 dia"/"3 dias", "1 truque"/"7 truques".
- **"No primeiro dia"** em vez de "em 1 dia".
- **Nome longo:** `nomeCurto()` + `adjustsFontSizeToFit` com `numberOfLines` definido.

**Paletas:**
- Pelo menos 2 por template (clara e escura), em tokens `bg`, `fg`, `muted`, `accent` e `surface`.
- **Temas Premium** são paletas com `premium: true`. O cadeado e o paywall (F38) ficam na pré-visualização, nunca no template.

**Marca:** "patinha.app · Treine seu cão em 10 min/dia", discreta (opacidade de 60 a 70%). O Premium **não** remove a marca.

## Passo 3 — Implementar no padrão do motor

**Cada template:**
- recebe `{ dados, paleta, largura, frameRef }` e desenha tudo multiplicando por `u`;
- envolve o conteúdo em `CardFrame`, que aplica a área segura e a marca e passa a ref para a captura;
- não faz `fetch` nem tem efeitos: a foto chega como URI **local** (cache);
- tem `fixtures` com os casos do Passo 4.

**Templates do Patinha:**

| Template | Momento | Dado herói |
|---|---|---|
| `TruqueDominado` | F19 (nível 4 com 3 acertos) | "aprendeu a …" |
| `Sequencia` | marcos 7/30/100/365 | dias treinando |
| `Conquista` | F24 | ícone + nome |
| `Carteirinha` | F25 | foto + "sabe N truques" + grade |
| `DesafioConcluido` | F26 | o desafio do mês |

**Captura:** `capturarCard(ref)` faz a captura em 1080×1920 da **própria pré-visualização**. No Android, uma View fora da tela pode sair em branco, então capture o que está na tela.

## Passo 4 — Cobrir os casos de borda com fixtures

Modelos prontos em `assets/fixtures-borda.json`:

| Caso | Exemplo | O que costuma quebrar |
|---|---|---|
| Sem foto | ilustração com inicial | buraco no layout |
| Foto horizontal ou muito escura | foto de celular deitada | rosto cortado; contraste |
| Nome longo | "Princesa Jujuba da Silva Sauro" | estoura a linha |
| Nome curto | "Bí" | proporção estranha |
| Truque com nome longo | "Ficar no lugar enquanto a porta abre" | 3+ linhas |
| Números extremos | 1 dia, 365 dias; 1 truque, 40 truques | plural e largura |
| Carteirinha vazia ou cheia | 0 ou 24 truques | grade apertada |
| Paleta clara e escura | as duas | contraste do texto `muted` |

## Passo 5 — Garantir o pipeline

1. **Foto em cache local** (`expo-file-system`), com `onLoad` antes de liberar "Compartilhar". Foto remota pode não estar pronta na hora da captura.
2. **Fontes carregadas** (`expo-font`) antes de qualquer captura.
3. **`collapsable={false}`** na View capturada (o `CardFrame` já faz isso).
4. **Compartilhar:** `expo-sharing`. Se `isAvailableAsync()` for falso, ofereça só "Salvar".
5. **Salvar:** `expo-media-library`, pedindo permissão **só ao salvar** (`writeOnly`).
6. **Eventos:** `card_generated {template, paleta}` e `card_shared {template}`. O `shareAsync` não informa se a pessoa postou; registre "abriu a folha".
7. **Instagram Stories direto:** o compartilhamento direto (sem a folha do sistema) exige App ID da Meta. Deixe para depois do lançamento.

## Passo 6 — Testar e revisar visualmente

1. **Unitários** (Jest): `texto.ts` (plural, `fraseTempo`, `nomeCurto`) e a montagem dos dados de cada template.
2. **Snapshot** dos componentes com `@testing-library/react-native` para cada fixture e paleta.
3. **Galeria de desenvolvimento** (rota só em `__DEV__`): todos os templates × paletas × fixtures, com o botão "Exportar todos", que captura cada um e compartilha um zip ou salva numa pasta.
4. **Revisão humana:** com os PNGs exportados no computador, monte a prancha:
   ```bash
   python <skill>/scripts/prancha.py pasta_dos_pngs/ -o prancha.png --colunas 4 --area-segura
   python <skill>/scripts/sobrepor_area_segura.py card.png -o card-conferencia.png
   ```
5. **Celular real, nos dois sistemas:** postar um card no story (pode ser numa conta privada).

## Formato da entrega

- O que mudou, em 2 a 4 linhas, com o brief se for template novo.
- Os casos de borda cobertos e algum que ficou feio de propósito, com o porquê.
- O roteiro para conferir no celular: abrir pelo QR do PR, gerar o card X, compartilhar no story e conferir Y.
