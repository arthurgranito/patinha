#!/usr/bin/env python3
"""Valida o conteúdo de adestramento do Patinha (content/).

Uso:
    python validar_conteudo.py content/            # valida (sai com 1 se houver ❌)
    python validar_conteudo.py content/ --roteiro  # gera o roteiro de revisão para o adestrador (Markdown)

Estrutura esperada:
    content/exercicios/<slug>.json
    content/programas/<slug>.json
    content/desafios/<AAAA-MM>.json

Só usa a biblioteca padrão.
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CATEGORIAS = {"obediencia", "comportamento", "truque", "enriquecimento"}
OBJETIVOS = {"xixi", "guia", "latido", "mordida", "pular", "chamado", "sozinho", "truques", "filhote"}
PROIBIDOS = [
    (r"enforcador", "enforcador"),
    (r"coleira de choque|\bchoque\b", "choque"),
    (r"borrifador", "borrifador como punição"),
    (r"\bcastig", "castigo"),
    (r"\bbronca\b", "bronca"),
    (r"esfreg\w* o focinho", "esfregar o focinho"),
    (r"domin[aâ]ncia|\balfa\b|líder da matilha", "teoria da dominância"),
    (r"\bpux(ão|ao|ões|oes)\b", "puxão"),
    (r"sem (água|agua|comida)", "privação de água/comida"),
    (r"garantid[oa]|100% (eficaz|garantido)", "promessa de resultado garantido"),
    (r"\bteimoso\b|\bburro\b|\bdesobediente\b", "rótulo negativo para o cão"),
]
NEGACAO = re.compile(r"(sem|não|nao|nunca|nada de|evite|jamais)\s+(\w+\s+){0,2}$")


class Relatorio:
    def __init__(self):
        self.erros, self.avisos = [], []

    def erro(self, onde, msg):
        self.erros.append(f"❌ {onde}: {msg}")

    def aviso(self, onde, msg):
        self.avisos.append(f"⚠️  {onde}: {msg}")


def texto_de(obj):
    if isinstance(obj, str):
        return [obj]
    if isinstance(obj, list):
        return [t for x in obj for t in texto_de(x)]
    if isinstance(obj, dict):
        return [t for k, v in obj.items() if k not in ("slug", "video_url", "reviewed_by", "reviewed_at") for t in texto_de(v)]
    return []


def checar_proibidos(r, onde, obj):
    for t in texto_de(obj):
        baixo = t.lower()
        for padrao, nome in PROIBIDOS:
            for m in re.finditer(padrao, baixo):
                if NEGACAO.search(baixo[max(0, m.start() - 25):m.start()]):
                    continue  # "nunca use enforcador": orientação correta
                r.erro(onde, f"termo proibido ({nome}): \"{t[:80]}\"")
                break


def tam(r, onde, campo, v, mi, ma):
    if not isinstance(v, str):
        r.erro(onde, f"{campo} deve ser texto")
        return
    if not (mi <= len(v.strip()) <= ma):
        r.erro(onde, f"{campo} com {len(v.strip())} caracteres (de {mi} a {ma})")


def checar_publicacao(r, onde, d, exige_video):
    if d.get("published") is True:
        if not d.get("reviewed_by"):
            r.erro(onde, "publicado sem reviewed_by (revisão do adestrador é obrigatória)")
        ra = d.get("reviewed_at")
        try:
            date.fromisoformat(ra or "")
        except ValueError:
            r.erro(onde, "publicado sem reviewed_at válido (AAAA-MM-DD)")
        if exige_video and not d.get("video_url"):
            r.erro(onde, "publicado sem video_url")
    elif d.get("published") is not False:
        r.erro(onde, "published deve ser true ou false")
    if d.get("reviewed_by") and "exemplo" in str(d.get("reviewed_by")).lower() and d.get("published"):
        r.erro(onde, "conteúdo de EXEMPLO não pode ser publicado")


def ler(r, caminho):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        r.erro(str(caminho), f"JSON inválido: {e}")
        return None


def validar_exercicio(r, caminho, d):
    onde = f"exercicios/{caminho.name}"
    slug = d.get("slug", "")
    if not SLUG.match(str(slug)):
        r.erro(onde, "slug inválido (minúsculas, números e hífen)")
    elif caminho.stem != slug:
        r.erro(onde, f"o nome do arquivo deve ser {slug}.json")
    tam(r, onde, "title", d.get("title"), 2, 40)
    if d.get("category") not in CATEGORIAS:
        r.erro(onde, f"category deve ser uma de {sorted(CATEGORIAS)}")
    gc = d.get("goal_codes")
    if not isinstance(gc, list) or not gc or any(g not in OBJETIVOS for g in gc):
        r.erro(onde, f"goal_codes deve ter 1+ de {sorted(OBJETIVOS)}")
    tam(r, onde, "summary", d.get("summary"), 20, 200)
    steps = d.get("steps")
    if not isinstance(steps, list) or not (3 <= len(steps) <= 6):
        r.erro(onde, "steps deve ter de 3 a 6 passos")
    else:
        for i, s in enumerate(steps, 1):
            tam(r, onde, f"steps[{i}]", s, 10, 140)
    levels = d.get("levels")
    if not isinstance(levels, list) or len(levels) != 4:
        r.erro(onde, "levels deve ter exatamente 4 níveis")
    else:
        for i, lv in enumerate(levels, 1):
            if not isinstance(lv, dict) or lv.get("n") != i:
                r.erro(onde, f"levels[{i}] deve ter n = {i}")
                continue
            tam(r, onde, f"levels[{i}].nome", lv.get("nome"), 3, 40)
            tam(r, onde, f"levels[{i}].criterio", lv.get("criterio"), 10, 160)
            if not re.search(r"\d|vez|vezes|segundo|sem |com |na |no |quando", str(lv.get("criterio", "")).lower()):
                r.aviso(onde, f"levels[{i}].criterio parece pouco observável (inclua quantas vezes, quanto tempo ou em que situação)")
    tips = d.get("tips")
    if not isinstance(tips, list) or not (1 <= len(tips) <= 4):
        r.erro(onde, "tips deve ter de 1 a 4 dicas")
    else:
        for i, t in enumerate(tips, 1):
            tam(r, onde, f"tips[{i}]", t, 10, 160)
    tam(r, onde, "safety_note", d.get("safety_note"), 10, 200)
    dm = d.get("duration_min")
    if not isinstance(dm, int) or not (1 <= dm <= 10):
        r.erro(onde, "duration_min deve ser inteiro de 1 a 10")
    ma = d.get("min_age_weeks")
    if not isinstance(ma, int) or not (8 <= ma <= 104):
        r.erro(onde, "min_age_weeks deve ser inteiro de 8 a 104")
    if not isinstance(d.get("is_premium"), bool):
        r.erro(onde, "is_premium deve ser true ou false")
    vu = d.get("video_url")
    if vu is not None and not re.match(r"^https://\S+\.mp4$", str(vu)):
        r.erro(onde, "video_url deve ser null ou uma URL https terminando em .mp4")
    checar_publicacao(r, onde, d, exige_video=True)
    checar_proibidos(r, onde, d)


def validar_programa(r, caminho, d, exercicios):
    onde = f"programas/{caminho.name}"
    slug = d.get("slug", "")
    if not SLUG.match(str(slug)):
        r.erro(onde, "slug inválido")
    elif caminho.stem != slug:
        r.erro(onde, f"o nome do arquivo deve ser {slug}.json")
    tam(r, onde, "title", d.get("title"), 2, 50)
    if d.get("goal_code") not in OBJETIVOS:
        r.erro(onde, f"goal_code deve ser um de {sorted(OBJETIVOS)}")
    tam(r, onde, "summary", d.get("summary"), 20, 200)
    weeks = d.get("weeks")
    days = d.get("days")
    if not isinstance(weeks, int) or not (1 <= weeks <= 8):
        r.erro(onde, "weeks deve ser inteiro de 1 a 8")
        weeks = None
    if not isinstance(days, list) or not days:
        r.erro(onde, "days não pode ser vazio")
        return
    if weeks and not (weeks * 5 <= len(days) <= weeks * 7):
        r.erro(onde, f"{len(days)} dias para {weeks} semana(s): use de {weeks*5} a {weeks*7}")
    nums = [x.get("day") for x in days if isinstance(x, dict)]
    if nums != list(range(1, len(days) + 1)):
        r.erro(onde, "days deve ser numerado 1, 2, 3… sem buracos nem repetição")
    ultimo_nivel = {}
    idade_max = 0
    usa_premium = False
    for dia in days:
        if not isinstance(dia, dict):
            continue
        itens = dia.get("items")
        dn = dia.get("day")
        if not isinstance(itens, list) or not (1 <= len(itens) <= 4):
            r.erro(onde, f"dia {dn}: de 1 a 4 itens")
            continue
        minutos = 0
        for it in itens:
            ex = it.get("exercise")
            tl = it.get("target_level")
            if ex not in exercicios:
                r.erro(onde, f"dia {dn}: exercício '{ex}' não existe em content/exercicios")
                continue
            if not isinstance(tl, int) or not (1 <= tl <= 4):
                r.erro(onde, f"dia {dn}: target_level de '{ex}' deve ser de 1 a 4")
                continue
            if ex in ultimo_nivel and tl < ultimo_nivel[ex] - 1:
                r.aviso(onde, f"dia {dn}: '{ex}' cai do nível {ultimo_nivel[ex]} para {tl} (mais de 1 de uma vez)")
            if ex in ultimo_nivel and tl > ultimo_nivel[ex] + 1:
                r.aviso(onde, f"dia {dn}: '{ex}' pula do nível {ultimo_nivel[ex]} para {tl} (progressão rápida demais)")
            ultimo_nivel[ex] = tl
            exd = exercicios[ex]
            minutos += exd.get("duration_min", 0) or 0
            idade_max = max(idade_max, exd.get("min_age_weeks", 0) or 0)
            usa_premium |= bool(exd.get("is_premium"))
            if d.get("published") and not exd.get("published"):
                r.erro(onde, f"dia {dn}: programa publicado usando exercício não publicado '{ex}'")
        if minutos > 15:
            r.erro(onde, f"dia {dn}: {minutos} min (máximo 15)")
    ma = d.get("min_age_weeks")
    if not isinstance(ma, int):
        r.erro(onde, "min_age_weeks deve ser inteiro")
    elif ma < idade_max:
        r.erro(onde, f"min_age_weeks ({ma}) menor que o do exercício mais exigente ({idade_max})")
    if not isinstance(d.get("is_premium"), bool):
        r.erro(onde, "is_premium deve ser true ou false")
    elif usa_premium and not d.get("is_premium"):
        r.aviso(onde, "programa grátis usando exercício Premium (o tutor grátis vai encontrar cadeado no meio do plano)")
    checar_publicacao(r, onde, d, exige_video=False)
    checar_proibidos(r, onde, {k: v for k, v in d.items() if k != "days"})


def validar_desafio(r, caminho, d, exercicios):
    onde = f"desafios/{caminho.name}"
    mes = d.get("month", "")
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", str(mes)):
        r.erro(onde, "month deve ser AAAA-MM")
    elif caminho.stem != mes:
        r.erro(onde, f"o nome do arquivo deve ser {mes}.json")
    tam(r, onde, "title", d.get("title"), 3, 60)
    tam(r, onde, "summary", d.get("summary"), 20, 200)
    if d.get("exercise") not in exercicios:
        r.erro(onde, f"exercício '{d.get('exercise')}' não existe")
    if not isinstance(d.get("is_premium"), bool):
        r.erro(onde, "is_premium deve ser true ou false")
    if d.get("published") not in (True, False):
        r.erro(onde, "published deve ser true ou false")
    elif d.get("published") and not (exercicios.get(d.get("exercise")) or {}).get("published"):
        r.erro(onde, "desafio publicado com exercício não publicado")
    checar_proibidos(r, onde, d)


def roteiro(exercicios, programas):
    linhas = ["# Roteiro de revisão do conteúdo — Patinha", "",
              "Para cada item, marque [x] quando estiver ok. Itens com problema: escreva a correção ao lado.", ""]
    for slug, d in sorted(exercicios.items()):
        status = "publicado" if d.get("published") else "rascunho"
        linhas += [f"## Exercício: {d.get('title')} (`{slug}`) · {status}", "",
                   f"**Para que serve:** {d.get('summary')}", "", "**Passos:**"]
        linhas += [f"{i}. {s}" for i, s in enumerate(d.get("steps", []), 1)]
        linhas += ["", "**Níveis:**"]
        linhas += [f"- N{lv.get('n')} · {lv.get('nome')}: {lv.get('criterio')}" for lv in d.get("levels", [])]
        linhas += ["", f"**Segurança:** {d.get('safety_note')}",
                   f"**Idade mínima:** {d.get('min_age_weeks')} semanas · **Duração:** {d.get('duration_min')} min · **Vídeo:** {d.get('video_url') or 'FALTA GRAVAR'}", "",
                   "- [ ] Método 100% reforço positivo",
                   "- [ ] Passos claros para um tutor leigo, um por vez",
                   "- [ ] Critérios de nível observáveis (o tutor consegue dizer sim/não)",
                   "- [ ] Nota de segurança adequada",
                   "- [ ] Idade mínima correta",
                   "- [ ] Vídeo bate com o texto", "",
                   "Revisado por: ____________ · Data: ____/____/______", ""]
    for slug, d in sorted(programas.items()):
        linhas += [f"## Programa: {d.get('title')} (`{slug}`)", "",
                   f"{d.get('summary')} · {d.get('weeks')} semana(s) · {len(d.get('days', []))} dias · idade mínima {d.get('min_age_weeks')} semanas", "",
                   "- [ ] Progressão gradual e realista",
                   "- [ ] Tempo diário adequado",
                   "- [ ] Revisões suficientes", "",
                   "Revisado por: ____________ · Data: ____/____/______", ""]
    return "\n".join(linhas)


def main(args):
    if not args:
        print(__doc__)
        return 2
    base = Path(args[0])
    gerar_roteiro = "--roteiro" in args
    r = Relatorio()
    exercicios, programas = {}, {}
    for c in sorted((base / "exercicios").glob("*.json")):
        d = ler(r, c)
        if isinstance(d, dict):
            if d.get("slug") in exercicios:
                r.erro(f"exercicios/{c.name}", f"slug duplicado: {d.get('slug')}")
            exercicios[d.get("slug")] = d
            validar_exercicio(r, c, d)
    for c in sorted((base / "programas").glob("*.json")):
        d = ler(r, c)
        if isinstance(d, dict):
            if d.get("slug") in programas:
                r.erro(f"programas/{c.name}", f"slug duplicado: {d.get('slug')}")
            programas[d.get("slug")] = d
            validar_programa(r, c, d, exercicios)
    desafios = sorted((base / "desafios").glob("*.json"))
    for c in desafios:
        d = ler(r, c)
        if isinstance(d, dict):
            validar_desafio(r, c, d, exercicios)

    if gerar_roteiro:
        print(roteiro(exercicios, programas))
        return 1 if r.erros else 0

    pub = sum(1 for d in exercicios.values() if d.get("published"))
    print(f"Conteúdo em {base}: {len(exercicios)} exercícios ({pub} publicados), {len(programas)} programas, {len(desafios)} desafios")
    for linha in r.erros + r.avisos:
        print(linha)
    if not r.erros and not r.avisos:
        print("✅ tudo certo")
    elif not r.erros:
        print("✅ sem erros (revise os avisos)")
    return 1 if r.erros else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
