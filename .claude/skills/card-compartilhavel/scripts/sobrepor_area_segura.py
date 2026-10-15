#!/usr/bin/env python3
"""Sobrepõe a área segura do story (topo/base proibidos e margens laterais) em um card.

Uso:
    python sobrepor_area_segura.py card.png -o card-conferencia.png

Avisa se o card não estiver em 1080x1920 (ou na mesma proporção 9:16).
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from _area_segura import W, H, sobrepor  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("-o", "--saida")
    a = ap.parse_args()
    img = Image.open(a.entrada)
    if img.size != (W, H):
        prop = img.width / img.height
        aviso = "proporção diferente de 9:16" if abs(prop - W / H) > 0.01 else "escala diferente"
        print(f"⚠️ {a.entrada}: {img.width}x{img.height} (esperado {W}x{H}, {aviso})")
    saida = a.saida or str(Path(a.entrada).with_name(Path(a.entrada).stem + "-area-segura.png"))
    sobrepor(img).convert("RGB").save(saida)
    print(f"✅ {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
