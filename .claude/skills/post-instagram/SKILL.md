---
name: post-instagram
description: Cria posts de Instagram e TikTok do Patinha (app de adestramento positivo gamificado para cães) para crescimento orgânico — roteiros de Reels/TikTok, carrosséis, posts estáticos e sequências de stories, com legenda, até 5 hashtags, CTA, texto alternativo e link com UTM — e monta calendários semanais. Também serve para os vídeos da validação. Use esta skill SEMPRE que o usuário pedir post, reels, tiktok, roteiro, carrossel, legenda, ideia de conteúdo, calendário editorial, "o que postar essa semana", divulgação do app, conteúdo com o adestrador parceiro ou lançamento de função, mesmo sem mencionar Instagram.
---

# Post de Instagram e TikTok do Patinha

O Patinha cresce por conteúdo orgânico, e cachorro aprendendo truque é um dos formatos mais fortes das redes. O post precisa:
- **alcançar quem ainda não segue a conta;**
- **ensinar algo útil de verdade** (com método positivo);
- **levar a pessoa a baixar o app.**

As métricas que importam são **salvamentos, compartilhamentos e instalações (UTM)**.

Antes de criar, procure no repositório:
- **`docs/progress.md`:** **nunca divulgue função que não existe**. Antes do lançamento, os posts levam para a lista de espera (`docs/validacao.md`).
- **`marketing/posts.md`:** não repita gancho nem tema das últimas 4 semanas.
- **O adestrador parceiro:** técnica ensinada em post precisa estar no conteúdo revisado do app (skill `licao-adestramento`) ou ser aprovada por ele.

## Passo 1 — Definir o objetivo

| Objetivo | Formato mais forte | CTA |
|---|---|---|
| **Alcance** | Reel/TikTok de 15 a 35 s | "manda pra quem tem cachorro que faz isso" |
| **Salvamento** | Carrossel de 7 a 10 slides (passo a passo) | "salva pra treinar hoje à noite" |
| **Conversa** | Carrossel curto ou stories | pergunta específica |
| **Instalação / lista** | Reel com o app de verdade (ou o mockup, na validação) | "link na bio" |

## Passo 2 — Escolher o pilar

| Pilar | % | Exemplos |
|---|---|---|
| **Antes e depois / progresso real** | ~30% | "Ensinei meu vira-lata a dar a pata em 3 dias", "Dia 1 × dia 14 andando na guia" |
| **Humor de tutor** | ~25% | "POV: seu cachorro ouviu o porteiro", "o xixi no tapete novo", "a cara dele quando você fala 'banho'" |
| **Dica rápida (método positivo)** | ~25% | "O erro que faz seu cachorro puxar a guia", "3 truques para ensinar em 5 minutos" |
| **Prova com o app** | ~10% | sessão com clicker, carteirinha, card de truque dominado, sequência |
| **Bastidores e adestrador** | ~10% | gravação das aulas, o adestrador respondendo dúvidas, build in public |

Os ganchos, as estruturas e os exemplos estão em `references/formatos-e-ganchos.md`. Leia antes de escrever.

## Passo 3 — Tom e bem-estar animal

- **Voz de tutor apaixonado:** pt-BR informal, frases curtas, humor carinhoso com o cachorro.
- **Só reforço positivo.**
  - **Nunca mostre nem sugira** enforcador, choque, bronca, castigo, "dominância" ou "ser o alfa", nem puxar a guia com força.
  - **Esse tipo de conteúdo** prejudica o cão, gera denúncia e contradiz o produto.
- **Sem promessa de cura:** "ajuda", "em poucos dias muitos cães já…", nunca "garantido" nem "100%".
- **Casos graves** (agressividade, ansiedade severa) **não viram dica**. O post orienta procurar um profissional presencial ou um veterinário.
- **O vira-lata é o protagonista.** Valorize SRD, apartamento e a realidade brasileira (porteiro, fogos, calor, quintal).
- **Nunca chame o cão de** "burro", "teimoso" ou "desobediente". Prefira "ainda está aprendendo".
- **Emoji:** de 1 a 3 por legenda. 🐾🐶🦴 são os da casa.

## Passo 4 — Regras da plataforma

- **Hashtags: no máximo 5 por post no Instagram** (limite atual, aplicado aos poucos desde dez/2025). Use de 3 a 5:
  - 1 ou 2 amplas: `#cachorro`, `#adestramento`;
  - 1 ou 2 de nicho: `#viralata`, `#filhote`, `#adestramentopositivo`, `#cachorrodeapartamento`;
  - 1 da marca: `#patinhaapp`.

  Nada de `#reels`, `#fyp` nem `#explore`.
- **TikTok:** gancho na tela já no primeiro quadro; até 5 hashtags também, por consistência.
- **Palavras-chave** na legenda, na tela e na fala ("adestrar cachorro", "cachorro puxando guia", "xixi no lugar certo").
- **Legenda:** a 1ª linha (~125 caracteres) é o gancho; o total vai até 2.200 caracteres.
- **Medidas:** Reel 1080×1920 (área segura: skill `card-compartilhavel`); carrossel 1080×1350.
- **Texto alternativo** em toda imagem.
- **Direitos e privacidade:**
  - nada de música com letra transcrita;
  - vídeos de cães de terceiros só com autorização por escrito do tutor;
  - não mostre rosto de criança;
  - nada de placa de carro nem endereço.
- **Publicidade:** parceria ou permuta com criadores e adestradores precisa de identificação (#publi, "parceria paga" ou o recurso de parceria), conforme o CONAR.

## Passo 5 — Produzir a ficha do post

```markdown
### <Título interno> · <formato> · <objetivo> · <pilar>

**Gancho (0–2 s / slide 1 / 1ª linha):** <texto>

**Roteiro / slides:**
| Tempo ou slide | Texto na tela | Fala ou narração | Visual / cena |
|---|---|---|---|

**Legenda:**
<1ª linha = gancho>
<corpo com a palavra-chave>
<1 CTA>
<3 a 5 hashtags>

**Texto alternativo:** <descrição>
**Link com UTM:** ver abaixo
**Áudio:** <original / narração / "áudio em alta de humor">
**Cachorro que aparece:** <nome e autorização do tutor>
**Revisão técnica:** <ok do adestrador / não se aplica (humor)>
**Como gravar em 10 minutos:** <passos práticos>
```

**UTM:** `https://<domínio>/?utm_source=<instagram|tiktok>&utm_medium=<reel|carrossel|stories|bio>&utm_campaign=<slug>`. Antes do lançamento, o link leva à lista de espera; depois, à página que manda para a loja certa. O PostHog cruza com `signup`.

**Valide cada legenda antes de entregar:**
```bash
python <caminho-da-skill>/scripts/checar_legenda.py legenda.txt
```
Corrija os ❌; os ⚠️ são decisão sua, explicada.

## Passo 6 — Calendário semanal

Use `assets/calendario-semana.md`. As regras:
- **De 3 a 5 posts por semana, com pelo menos 2 vídeos.** O mesmo vídeo vai para o Reels e o TikTok.
- **1 dica do método** e **1 progresso real** por semana, no mínimo.
- **Datas fortes:**
  - Réveillon e festas juninas (fogos: como ajudar o cão com medo, com indicação de veterinário em casos graves);
  - Dia Mundial do Cão (26/08);
  - Dia de São Francisco (04/10);
  - Dia Internacional do Vira-lata (31/07);
  - férias (cão sozinho em casa);
  - calor (passeio na hora certa);
  - volta ao trabalho presencial (ansiedade de separação leve).
- **Desafio do mês do app:** quando existir, vira série ("Dia 1 do Mês do Dá a Pata").

## Passo 7 — Medir e aprender

Sete dias depois de cada post, registre:
- alcance de não seguidores;
- salvamentos;
- compartilhamentos;
- cliques no link;
- **cadastros ou inscrições na lista com o UTM do post**.

Compare por **gancho** e **pilar** e proponha mais do que funcionou. Registre em `marketing/posts.md`.
