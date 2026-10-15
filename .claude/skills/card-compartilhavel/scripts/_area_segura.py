"""Desenho da área segura do story, compartilhado pelos dois scripts."""
from PIL import Image, ImageDraw

W, H = 1080, 1920
TOPO, BASE, LADO = 250, 250, 72


def sobrepor(img: Image.Image) -> Image.Image:
    """Devolve uma cópia RGBA com as faixas proibidas em vermelho e a margem lateral tracejada."""
    base = img.convert("RGBA")
    sx, sy = base.width / W, base.height / H
    camada = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    vermelho = (230, 40, 40, 90)
    d.rectangle([0, 0, base.width, int(TOPO * sy)], fill=vermelho)
    d.rectangle([0, base.height - int(BASE * sy), base.width, base.height], fill=vermelho)
    x0, x1 = int(LADO * sx), base.width - int(LADO * sx)
    y0, y1 = int(TOPO * sy), base.height - int(BASE * sy)
    passo = max(6, int(20 * sy))
    for y in range(y0, y1, passo * 2):
        d.line([x0, y, x0, min(y + passo, y1)], fill=(230, 40, 40, 200), width=max(1, int(3 * sx)))
        d.line([x1, y, x1, min(y + passo, y1)], fill=(230, 40, 40, 200), width=max(1, int(3 * sx)))
    return Image.alpha_composite(base, camada)
