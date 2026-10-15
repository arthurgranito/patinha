---
name: implementar-fase
description: Implementa uma fase do roadmap do projeto (docs/roadmap.md) de ponta a ponta — carrega a seção da fase, os fluxos de docs/flows.md ligados a ela e as convenções do AGENTS.md, propõe um plano, implementa em fatias com testes e commits, roda toda a verificação, mapeia cada critério "Pronto quando você vê" para uma checagem e atualiza docs/progress.md. Use esta skill SEMPRE que o usuário pedir para implementar, executar, construir, começar, continuar ou retomar uma fase ("implementa a fase 4", "bora pra próxima fase", "faz a fase 2", "/implementar-fase 7", "continua o roadmap"), mesmo que ele não diga a palavra "skill" e mesmo que só cole o prompt de uma fase do roadmap.
---

# Implementar fase do roadmap

Esta skill transforma uma fase do `docs/roadmap.md` em código funcionando, testado e verificado, sem perder nenhum detalhe do `docs/flows.md`.

O roadmap diz **o que** construir em cada fase. O mapa de fluxos diz **como cada tela se comporta**, incluindo caminhos alternativos, erros e as mensagens exatas exibidas ao usuário. O motivo de usar esta skill em vez de só colar o prompt da fase: o prompt sozinho não carrega os fluxos, as lacunas atribuídas à fase nem os critérios de aceite, e é aí que bugs de produto escapam.

## Passo 0 — Localizar os documentos

Procure na raiz do repositório:

| Arquivo | Papel | Se não existir |
|---|---|---|
| `AGENTS.md` (ou `CLAUDE.md`) | Convenções do projeto | Avise; siga as convenções que encontrar no código |
| `docs/roadmap.md` | Escopo de cada fase | **Pare** e peça o arquivo; sem ele não há fase |
| `docs/flows.md` | Comportamento detalhado | Avise que a cobertura de fluxos ficará limitada e continue |
| `docs/progress.md` | Estado de cada fase | Crie a partir de `assets/progress-template.md`, ajustando nomes e custos ao roadmap real |

## Passo 1 — Identificar a fase

- **Número explícito** ("fase 4"): use o número dado. Fases com letra (como "V" de validação e "P" de preview) não passam pelo script: leia a seção `### Fase V` ou `### Fase P` direto no roadmap.
- **"Próxima", "continua" ou "segue o roadmap":** use a primeira fase de `docs/progress.md` que não esteja ✅.
- **Prompt da fase colado na conversa:** descubra o número comparando o texto com o roadmap.

Antes de seguir, confira as dependências:
- **Fase anterior ✅:** siga normalmente.
- **Fase anterior 🔍 (aguardando verificação):** avise ("A fase N-1 ainda espera sua conferência na tela") e pergunte se pode seguir mesmo assim.
- **Fase anterior ⬜ ou 🟡:** recomende terminá-la primeiro. Só pule a fase se o usuário confirmar, e registre o pulo em "Desvios".

## Passo 2 — Checar o ponto de partida

Um baseline quebrado faz você caçar bugs que não são seus. Antes de escrever código:

1. `git status` precisa estar limpo. Se não estiver, pergunte se deve fazer commit ou stash.
2. Crie a branch `fase-<N>-<slug>`, por exemplo `fase-6-sessao-de-treino`.
3. Rode a verificação rápida que o projeto tiver (lint, typecheck e testes unitários, normalmente `make lint` e `make test`).
4. Se algo já falhar, **pare** e relate o que falhou antes de começar. Não misture correção de baseline com a fase.

## Passo 3 — Carregar o contexto da fase

Rode o script que reúne tudo da fase em um só lugar (isso economiza contexto e evita esquecer pedaços):

```bash
python <caminho-da-skill>/scripts/extrair_fase.py <N>
# opções: --roadmap docs/roadmap.md --flows docs/flows.md
```

O script imprime:
1. A seção da fase (prompt, "Pronto quando você vê" e custo).
2. Os ADRs citados.
3. O detalhamento de cada fluxo marcado com a fase.
4. As lacunas atribuídas à fase.
5. As linhas da matriz de rastreabilidade (entidades e endpoints).

Leia a saída inteira. Se o Python não estiver disponível, extraia as mesmas seções manualmente.

**Precedência quando os documentos divergem:**
- **Escopo** (o que entra na fase): vale o roadmap mais as lacunas atribuídas à fase.
- **Comportamento** (passos, alternativos, erros, textos de tela): vale o `flows.md`, que é mais detalhado e mais recente.
- **Convenções de código:** vale o `AGENTS.md`.
- **Divergência que muda escopo ou custo:** pergunte ao usuário antes de decidir.

**Fluxos que atravessam várias fases** (por exemplo, "Fase 1 / 3 / 8"): implemente só a parte que depende do que já existe ou do que esta fase entrega. Deixe no código um comentário `// TODO(fase X): <o quê>` para o restante, e anote-o no relatório.

## Passo 4 — Propor o plano e esperar o OK

Mostre o plano antes de implementar, porque é o momento mais barato para o usuário corrigir o rumo. Use este formato:

```markdown
## Plano — Fase N: <nome>

**Escopo:** <2–4 linhas>
**Fora do escopo (fica para depois):** <itens e a fase de cada um>

**Fluxos cobertos:** F11 (completo), F13 (completo), F02 (só passo 4–5; resto na Fase 3) …
**Lacunas incluídas:** <da saída do script>

**Migrations:** <tabelas, colunas, índices, triggers, políticas RLS>
**Arquivos principais:** <lista curta, agrupada por camada>

**Testes planejados (fluxo → teste):**
| Fluxo / caso | Tipo | Teste |
|---|---|---|
| F19-2e fora de hoje/ontem | pgTAP | `sessao_dia_logico.sql` |
| F19 sobe de nível com 3 acertos | pgTAP + unit | `progressao.sql`, `ResultadoSessao.test.tsx` |

**Critérios de pronto → como vou provar:**
| Critério do roadmap | Prova automática | Conferência manual sua |
|---|---|---|

**Passos manuais seus (painéis externos, chaves):** <ou "nenhum">
**Riscos:** <Expo Go × development build, limites de API, regras das lojas etc.>
**Tamanho:** <P / M / G>
```

Espere a aprovação, a menos que o usuário tenha dito para seguir direto ("sem parar", "manda ver").

Se o plano passar de uns 25 arquivos ou misturar mais de dois domínios, proponha dividir a fase em `N.a` e `N.b`, cada uma com seus próprios critérios de pronto. Fases menores revisam e testam melhor.

## Passo 5 — Implementar em fatias verticais

Implemente na ordem abaixo, fazendo commit ao fim de cada fatia (Conventional Commits, em português). Commits pequenos facilitam reverter e revisar.

1. **Banco:** migration, políticas RLS e testes pgTAP. Mensagem do tipo `feat(db): ...`.
2. **Tipos:** regenere os tipos do Supabase.
3. **Servidor:** server actions e route handlers, com validação Zod na entrada.
4. **Interface:** telas e componentes, incluindo os estados de carregando, vazio, erro e offline.
5. **Testes:** unitários (Jest), pgTAP e, para os fluxos de tela, um roteiro Maestro em `.maestro/` que o usuário roda no aparelho.

Regras que evitam os erros mais comuns neste projeto:
- **Copie as mensagens de erro e os textos de tela exatamente como estão no `flows.md`.** Elas foram escritas como contrato de produto, e os testes devem verificá-las literalmente.
- **Cubra os fluxos alternativos e de erro**, não só o caminho feliz. Cada item "Ne" de um fluxo deve ter um tratamento visível e, quando der, um teste.
- **Toda tabela nova nasce com RLS ligado**, mais testes que provem que um usuário não lê nem altera dados de outro.
- **Valide permissões no servidor.** Esconder um botão na interface não é segurança.
- **Teste sempre com outro usuário.** Os cães, as fotos e os treinos são privados. Toda tabela, RPC, Edge Function e política do Storage precisa de um teste provando que outro usuário não lê nem altera nada.
- **Regras de níveis, datas, sequência e limites do plano ficam no banco** (ADR-02 e ADR-05). Use sempre a função de dia lógico do tutor; nunca calcule datas no app para gravar.
- **Premium só pelo banco** (ADR-06). A interface pode usar o SDK do RevenueCat, mas toda liberação de conteúdo é checada no banco via `is_premium`.
- **Bem-estar animal e tom** (ADR-07). Nenhum texto ou exercício sugere punição; "Ainda não" é incentivo; nunca prometa resultado garantido; casos graves vão para um profissional.
- **Respeite o ADR-01.** Dependências nativas só com `npx expo install`; nunca edite `ios/` ou `android/` à mão (use config plugins); avise no plano se a fase exige um development build novo (módulo nativo) ou se basta EAS Update.
- **Não invente segredos e não faça commit de `.env`.** Variáveis novas vão para `.env.example` com um comentário explicando de onde vêm.
- **Não puxe escopo de fases futuras.** Se perceber uma necessidade de outra fase, anote no relatório em vez de implementar.

## Passo 6 — Verificar tudo

Rode a verificação completa e corrija até passar:

- lint;
- typecheck;
- testes unitários;
- testes do banco (`supabase test db`);
- `expo-doctor` (dependências incompatíveis com o SDK);
- **`npx expo export --platform all`**, que pega erros de bundling que o typecheck não mostra.

Os roteiros Maestro não rodam na nuvem sem emulador: liste-os no relatório para o usuário rodar no aparelho.

Se algo não passar depois de tentativas razoáveis, **não esconda**: pare e explique o erro, o que você tentou e as opções. Nunca desabilite um teste, pule uma checagem ou relaxe uma política RLS para ver o check verde.

## Passo 7 — Provar os critérios "Pronto quando você vê"

Os critérios do roadmap descrevem o que o usuário vê na tela, e muitos dependem de um celular real, do Instagram ou de painéis externos que você não enxerga. Por isso, para cada critério:

- **Prova automática:** quando um teste (pgTAP, Jest) cobre o critério, cite o nome do teste.
- **Preview no celular:** o PR recebe o QR code do EAS Update. Escreva o roteiro para abrir pelo QR (Expo Go até a Fase 7; development build depois) e conferir cada critério.
- **Conferência manual:** quando não der para automatizar, escreva um roteiro curto e concreto para o usuário seguir ("1. Abra no iPhone… 2. Toque em… 3. Você deve ver…").

Marque a fase como **🔍 aguardando sua verificação**, nunca ✅. Só o usuário fecha a fase, porque só ele vê o resultado no aparelho real.

## Passo 8 — Atualizar a documentação

- **`docs/progress.md`:** status 🔍, data e custo mensal depois da fase (copiado do roadmap). Na coluna de observações, anote os TODOs deixados para outras fases.
- **Desvios:** registre em `docs/progress.md` qualquer decisão que divergiu do roadmap ou dos fluxos, com o motivo.
- **`docs/flows.md`:** se um comportamento mudou de propósito (por exemplo, uma mensagem ou uma regra), atualize o fluxo para o documento continuar sendo a fonte de verdade.
- **`AGENTS.md`:** se surgiu uma convenção nova (por exemplo, como fazer rate limit), documente-a ali.
- **`.env.example`:** inclua as variáveis novas.

Faça commit da documentação junto com a última fatia ou em um commit `docs: fase N`.

## Passo 9 — Relatório final

Responda com este formato, curto e sem repetir o código:

```markdown
## Fase N — <nome>: pronta para sua conferência 🔍

**Branch:** fase-N-slug · **Commits:** <n> · **Verificação:** lint ✅ typecheck ✅ jest ✅ pgTAP ✅ expo-doctor ✅ export ✅ · **Precisa de build nativo novo?** sim/não

**Entregue:** <3–6 linhas>
**Fluxos cobertos:** <lista, com "parcial" onde couber>

**Confira na tela:**
1. <roteiro do critério 1>
2. …

**Passos manuais seus:** <painéis, chaves, ou "nenhum">
**Ficou para depois:** <TODOs e a fase de cada um>
**Desvios:** <ou "nenhum">
**Custo mensal agora:** <valor do roadmap>

Quando conferir, me diga "fase N confirmada" que eu fecho a fase.
```

## Fechar a fase

Quando o usuário confirmar ("fase N confirmada", "tá ok", "pode fechar"):
1. Marque ✅ em `docs/progress.md` com a data.
2. Faça commit (`docs: conclui fase N`).
3. Sugira abrir o PR ou fazer o merge na `main` (não faça merge sem pedido explícito).
4. Diga qual é a próxima fase e o que ela entrega, em uma frase.

Se o usuário relatar um problema na conferência, trate-o como parte da mesma fase: corrija, verifique de novo (Passo 6) e atualize o roteiro de conferência. A fase só fecha quando o que ele vê na tela bate com o critério.
