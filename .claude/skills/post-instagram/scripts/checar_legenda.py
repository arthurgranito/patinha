#!/usr/bin/env python3
"""Confere legendas de Instagram/TikTok do Patinha antes de publicar.

Uso:
    python checar_legenda.py legenda.txt [outra.txt ...]
    echo "texto" | python checar_legenda.py -

Regras (❌ bloqueia, ⚠️ revise):
  ❌ mais de 2.200 caracteres
  ❌ mais de 5 hashtags (limite atual do Instagram)
  ❌ hashtags genéricas (#reels, #explore, #fyp...)
  ⚠️ 1ª linha com mais de 125 caracteres (é o que aparece antes do "mais")
  ⚠️ nenhuma hashtag, ou sem #patinhaapp
  ⚠️ nenhum CTA ou mais de um tipo de CTA
  ⚠️ mais de 3 emojis
  ⚠️ URL na legenda (não é clicável; use "link na bio")
  ⚠️ termos fora do tom da marca (punição, dominância, promessa garantida, rótulos)
Sai com código 1 se houver algum ❌.
"""
import re
import sys
from pathlib import Path

LIMITE_CARACTERES = 2200
LIMITE_HASHTAGS = 5
LIMITE_PRIMEIRA_LINHA = 125
LIMITE_EMOJIS = 3

GENERICAS = {
    "reels", "reel", "explore", "explorepage", "fyp", "foryou", "foryoupage", "viral",
    "instagood", "trending", "reelsinstagram", "instagram", "follow", "like4like",
}

CTAS = {
    "instalação": [r"link na bio", r"baixa", r"testa o patinha", r"instala", r"lista de espera"],
    "salvamento": [r"\bsalva\b", r"salve"],
    "compartilhamento": [r"manda (pra|para)", r"envia (pra|para)", r"compartilha"],
    "marcação": [r"\bmarca (quem|aquela|aquele|sua|seu|a sua|o seu|a\s+@|o\s+@|@)"],
    "comentário": [r"comenta", r"conta aqui", r"me conta", r"responde aqui", r"nos coment"],
}

FORA_DO_TOM = {
    r"\bstreak\b": 'use "sequência" no lugar de "streak"',
    r"\bdescubra\b|\bsolução definitiva\b": "voz de empresa; prefira tom de tutor apaixonado",
    r"enforcador|coleira de choque|\bchoque\b|\bcastigo\b|\bbronca\b|\bpuxão\b|\bpuxao\b": "punição/aversivo: o Patinha é só reforço positivo",
    r"domin[aâ]ncia|\bser o alfa\b|\bmacho alfa\b|\blíder da matilha\b": "teoria da dominância: contradiz o método positivo",
    r"\bteimoso\b|\bburro\b|\bdesobediente\b": 'evite rotular o cão; prefira "ainda está aprendendo"',
    r"garantid[oa]|100% (eficaz|garantido)|\bcura\b": "promessa de resultado garantido: proibido (ADR-07)",
    r"gamifica": 'evite jargão; fale "nível", "sequência", "carteirinha"',
}

EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF\U0001F900-\U0001F9FF]"
)


def checar(texto: str) -> tuple[list[str], list[str], list[str]]:
    erros, avisos, infos = [], [], []
    texto = texto.strip()
    n = len(texto)
    infos.append(f"{n} caracteres")
    if n > LIMITE_CARACTERES:
        erros.append(f"{n} caracteres (máximo {LIMITE_CARACTERES})")

    primeira = texto.splitlines()[0] if texto else ""
    if len(primeira) > LIMITE_PRIMEIRA_LINHA:
        avisos.append(f"1ª linha com {len(primeira)} caracteres; o gancho pode ser cortado antes do \"mais\" (ideal ≤ {LIMITE_PRIMEIRA_LINHA})")
    if re.match(r"^(oi|olá|ola|bom dia|boa noite|gente)\b", primeira.lower()):
        avisos.append("1ª linha começa com saudação; comece pelo gancho")
    if primeira.lstrip().startswith("#"):
        avisos.append("1ª linha é hashtag; o gancho precisa vir primeiro")

    tags = [t.lower() for t in re.findall(r"#([\wÀ-ÿ]+)", texto)]
    infos.append(f"hashtags: {', '.join('#' + t for t in tags) or 'nenhuma'}")
    if len(tags) > LIMITE_HASHTAGS:
        erros.append(f"{len(tags)} hashtags (máximo {LIMITE_HASHTAGS})")
    if len(set(tags)) < len(tags):
        avisos.append("hashtag repetida")
    genericas = sorted({t for t in tags if t in GENERICAS})
    if genericas:
        erros.append("hashtags genéricas que atrapalham o alcance: " + ", ".join("#" + g for g in genericas))
    if not tags:
        avisos.append("nenhuma hashtag (use de 3 a 5 relevantes)")
    elif "patinhaapp" not in tags:
        avisos.append("sem #patinhaapp")

    baixo = texto.lower()
    tipos = [tipo for tipo, padroes in CTAS.items() if any(re.search(p, baixo) for p in padroes)]
    if not tipos:
        avisos.append("nenhum CTA identificado")
    elif len(tipos) > 1:
        avisos.append(f"mais de um tipo de CTA ({', '.join(tipos)}); prefira um só")
    else:
        infos.append(f"CTA: {tipos[0]}")

    emojis = EMOJI.findall(texto)
    if len(emojis) > LIMITE_EMOJIS:
        avisos.append(f"{len(emojis)} emojis (ideal ≤ {LIMITE_EMOJIS})")

    if re.search(r"https?://|www\.", baixo):
        avisos.append('URL na legenda não é clicável; use "link na bio" (com UTM)')

    negacao = re.compile(r"(sem|não é|nao e|nada de|nunca|zero|não use|nao use)\s+(o |a |um |uma )?$")
    for padrao, dica in FORA_DO_TOM.items():
        for m in re.finditer(padrao, baixo):
            antes = baixo[max(0, m.start() - 15):m.start()]
            if negacao.search(antes):
                continue  # "sem puxão", "não é bronca": negação, está no tom certo
            avisos.append(dica)
            break

    return erros, avisos, infos


def main(args: list[str]) -> int:
    if not args:
        print(__doc__)
        return 2
    algum_erro = False
    for a in args:
        texto = sys.stdin.read() if a == "-" else Path(a).read_text(encoding="utf-8")
        erros, avisos, infos = checar(texto)
        print(f"\n== {a if a != '-' else 'stdin'} ==")
        for i in infos:
            print(f"   {i}")
        for e in erros:
            print(f"❌ {e}")
        for w in avisos:
            print(f"⚠️  {w}")
        if not erros and not avisos:
            print("✅ tudo certo")
        algum_erro |= bool(erros)
    return 1 if algum_erro else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
