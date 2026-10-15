#!/usr/bin/env python3
"""Extrai tudo o que importa para implementar UMA fase do roadmap.

Uso:
    python scripts/extrair_fase.py <N> [--roadmap docs/roadmap.md] [--flows docs/flows.md]

Imprime, em Markdown:
  1. A seção "### Fase N" inteira do roadmap (prompt, critérios de pronto, custo).
  2. Os ADRs citados na seção.
  3. Os fluxos de docs/flows.md marcados com essa fase (tabela da seção 2) e o detalhamento completo de cada um.
  4. As linhas da tabela de lacunas (seção 5 de flows.md) atribuídas a essa fase.
  5. As linhas da matriz de rastreabilidade desses fluxos.

Só usa a biblioteca padrão. Se algum arquivo não existir, avisa e continua com o que houver.
"""
import argparse
import re
import sys
from pathlib import Path


def ler(caminho: str) -> str | None:
    p = Path(caminho)
    if not p.exists():
        print(f"> ⚠️ Arquivo não encontrado: `{caminho}`\n")
        return None
    return p.read_text(encoding="utf-8")


def secao_da_fase(roadmap: str, n: int) -> str | None:
    # Captura de "### Fase N —" até o próximo "### " ou "## " ou "---" de nível de fase.
    padrao = re.compile(rf"^### Fase {n}\b.*?(?=^### Fase \d+\b|^## |\Z)", re.S | re.M)
    m = padrao.search(roadmap)
    if not m:
        return None
    return m.group(0).rstrip().rstrip("-").rstrip()


def adrs_citados(roadmap: str, secao: str) -> list[str]:
    ids = sorted(set(re.findall(r"ADR-(\d{2})", secao)))
    blocos = []
    for i in ids:
        m = re.search(rf"^\*\*ADR-{i}\b.*?(?=^\*\*ADR-\d{{2}}|^---|^## |\Z)", roadmap, re.S | re.M)
        if m:
            blocos.append(m.group(0).strip())
    return blocos


def fase_bate(celula: str, n: int) -> bool:
    return str(n) in re.findall(r"\d+", celula)


def fluxos_da_fase(flows: str, n: int) -> list[str]:
    ids = []
    for linha in flows.splitlines():
        m = re.match(r"^\|\s*(F\d{2})\s*\|.*\|\s*([^|]*)\|\s*$", linha)
        if m and fase_bate(m.group(2), n):
            ids.append(m.group(1))
    return ids


def detalhe_fluxo(flows: str, fid: str) -> str | None:
    m = re.search(rf"^#### {fid}\b.*?(?=^#### |^### |^## |\Z)", flows, re.S | re.M)
    return m.group(0).rstrip() if m else None


def secao(flows: str, titulo_regex: str) -> str:
    m = re.search(rf"^## {titulo_regex}.*?(?=^## |\Z)", flows, re.S | re.M)
    return m.group(0) if m else ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("fase", type=int)
    ap.add_argument("--roadmap", default="docs/roadmap.md")
    ap.add_argument("--flows", default="docs/flows.md")
    a = ap.parse_args()
    n = a.fase

    print(f"# Contexto da Fase {n}\n")

    roadmap = ler(a.roadmap)
    if roadmap:
        s = secao_da_fase(roadmap, n)
        if not s:
            print(f"> ❌ Fase {n} não encontrada em `{a.roadmap}`.\n")
            return 1
        print("## 1. Seção do roadmap\n")
        print(s + "\n")
        adrs = adrs_citados(roadmap, s)
        if adrs:
            print("## 2. ADRs citados\n")
            print("\n\n".join(adrs) + "\n")

    flows = ler(a.flows)
    if flows:
        ids = fluxos_da_fase(flows, n)
        print(f"## 3. Fluxos desta fase ({', '.join(ids) if ids else 'nenhum'})\n")
        for fid in ids:
            d = detalhe_fluxo(flows, fid)
            print((d or f"> ⚠️ Detalhamento de {fid} não encontrado.") + "\n")

        lac = secao(flows, r"5\.")
        linhas = [l for l in lac.splitlines()
                  if l.startswith("|") and not l.startswith("|---")
                  and fase_bate(l.rstrip(" |").rsplit("|", 1)[-1], n)]
        if linhas:
            print("## 4. Lacunas atribuídas a esta fase (incluir no escopo)\n")
            print("| Item | Por quê | Fase |\n|---|---|---|")
            print("\n".join(linhas) + "\n")

        matriz = secao(flows, r"4\.")
        mlin = [l for l in matriz.splitlines() if any(l.startswith(f"| {fid} ") for fid in ids)]
        if mlin:
            print("## 5. Matriz de rastreabilidade (entidades e endpoints)\n")
            print("| Fluxo | Entidades | Endpoints / ações |\n|---|---|---|")
            print("\n".join(mlin) + "\n")

        print("## 6. Lembrete\n")
        print("Os comportamentos transversais (seção X de docs/flows.md) valem para todas as telas desta fase. "
              "Leia essa seção também.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
