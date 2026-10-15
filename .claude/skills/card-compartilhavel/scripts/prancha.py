#!/usr/bin/env python3
"""Monta uma prancha (contact sheet) com vários cards PNG, rotulados pelo nome do arquivo.

Uso:
    python prancha.py pasta_dos_pngs/ -o prancha.png [--colunas 4] [--largura 360] [--area-segura]

- Ordena os arquivos por nome (use nomes como sessao__escuro__tituloLongo.png).
- Marca com ⚠️ no rótulo os cards que não estão em 1080x1920.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from _area_segura import W, H, sobrepor  # noqa: E402


def fonte(px: int):
    for nome in ("DejaVuSans.ttf", "Arial.ttf", "Helvetica.ttc"):
        try:
            return ImageFont.truetype(nome, px)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta")
    ap.add_argument("-o", "--saida", default="prancha.png")
    ap.add_argument("--colunas", type=int, default=4)
    ap.add_argument("--largura", type=int, default=360, help="largura de cada miniatura em px")
    ap.add_argument("--area-segura", action="store_true")
    a = ap.parse_args()

    arquivos = sorted(Path(a.pasta).glob("*.png"))
    if not arquivos:
        print(f"❌ Nenhum PNG em {a.pasta}")
        return 1

    lw = a.largura
    lh = round(lw * H / W)
    rotulo_h, gap = 44, 16
    cols = min(a.colunas, len(arquivos))
    linhas = (len(arquivos) + cols - 1) // cols
    prancha = Image.new("RGB", (cols * (lw + gap) + gap, linhas * (lh + rotulo_h + gap) + gap), (245, 245, 245))
    d = ImageDraw.Draw(prancha)
    f = fonte(14)

    avisos = 0
    for i, arq in enumerate(arquivos):
        img = Image.open(arq)
        ok = img.size == (W, H)
        avisos += 0 if ok else 1
        if a.area_segura:
            img = sobrepor(img)
        mini = img.convert("RGB").resize((lw, lh), Image.LANCZOS)
        c, l = i % cols, i // cols
        x = gap + c * (lw + gap)
        y = gap + l * (lh + rotulo_h + gap)
        prancha.paste(mini, (x, y))
        d.rectangle([x - 1, y - 1, x + lw, y + lh], outline=(200, 200, 200))
        nome = arq.stem if ok else f"⚠️ {arq.stem} ({img.width}x{img.height})"
        d.text((x, y + lh + 8), nome[:48], fill=(30, 30, 30) if ok else (200, 30, 30), font=f)

    prancha.save(a.saida)
    print(f"✅ {a.saida}: {len(arquivos)} cards" + (f", {avisos} fora de 1080x1920" if avisos else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
