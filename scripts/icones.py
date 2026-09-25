#!/usr/bin/env python3
"""Icônes de l'app à partir de design/logo.png.

Le logo officiel n'est pas détouré : son fond est un blanc à ~50 %
d'opacité. On l'aplatit sur blanc, puis on rend transparent le blanc
qui touche les bords — le blanc intérieur (le parchemin) est conservé.

Le personnage seul sert d'icône : l'écusson, étroit et haut, ne fait
que 74 x 90 px dans le fichier et devient illisible une fois agrandi.

    python3 scripts/icones.py
"""

from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

RACINE = Path(__file__).resolve().parent.parent
JAUNE = (245, 196, 0, 255)  # --jaune de app/globals.css

# Dans design/logo.png. La découpe va jusqu'au bout du pied droit (x = 623),
# juste avant l'écusson ; elle attrape donc le début du texte, effacé ensuite.
PERSONNAGE = (200, 20, 624, 452)
TEXTE = (388, 0, 424, 310)  # dans le repère de la découpe

# Blanc emprisonné à l'intérieur du dessin, que le remplissage depuis les bords
# n'atteint pas : il doit laisser voir le jaune, pas rester blanc.
POCHES = [(203, 178)]  # entre le bonnet et le corps


def detoure(img: Image.Image) -> Image.Image:
    """Blanc extérieur -> transparent, par remplissage depuis les bords."""
    w, h = img.size
    t = img.copy()
    magenta = (255, 0, 255)
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
               (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        ImageDraw.floodfill(t, xy, magenta, thresh=40)
    a = np.array(t)
    fond = (a[..., 0] > 240) & (a[..., 1] < 15) & (a[..., 2] > 240)
    return Image.fromarray(np.dstack([np.array(img), np.where(fond, 0, 255).astype("uint8")]), "RGBA")


def vide_poches(img: Image.Image, points) -> Image.Image:
    """Rend transparentes les zones blanches fermées désignées par un point."""
    a = np.array(img)
    blanc = (a[..., 3] > 0) & (a[..., :3].mean(axis=2) > 242)
    lab, _ = ndimage.label(blanc)
    for x, y in points:
        n = lab[y, x]
        if n:
            a[lab == n, 3] = 0
    return Image.fromarray(a, "RGBA")


def sans_miettes(img: Image.Image, seuil=0.002) -> Image.Image:
    """Supprime les taches isolées laissées par le détourage (parcours en largeur)."""
    a = np.array(img)
    plein = a[..., 3] > 0
    h, w = plein.shape
    vus = np.zeros_like(plein)
    for y0 in range(h):
        for x0 in range(w):
            if not plein[y0, x0] or vus[y0, x0]:
                continue
            pile, taches = [(y0, x0)], []
            vus[y0, x0] = True
            while pile:
                y, x = pile.pop()
                taches.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and plein[ny, nx] and not vus[ny, nx]:
                        vus[ny, nx] = True
                        pile.append((ny, nx))
            if len(taches) < seuil * h * w:
                for y, x in taches:
                    a[y, x, 3] = 0
    return Image.fromarray(a, "RGBA")


def icone(sujet: Image.Image, taille: int, occupation: float, fond=JAUNE) -> Image.Image:
    s = sujet.copy()
    s.thumbnail((round(taille * occupation), round(taille * occupation)), Image.LANCZOS)
    im = Image.new("RGBA", (taille, taille), fond)
    im.alpha_composite(s, ((taille - s.width) // 2, (taille - s.height) // 2))
    return im


def main() -> None:
    src = Image.open(RACINE / "design/logo.png").convert("RGBA")
    plat = Image.alpha_composite(Image.new("RGBA", src.size, (255,) * 4), src).convert("RGB")
    decoupe = plat.crop(PERSONNAGE)
    ImageDraw.Draw(decoupe).rectangle(TEXTE, fill=(255, 255, 255))
    perso = sans_miettes(vide_poches(detoure(decoupe), POCHES))

    # 0.92 : une icône d'application remplit son carré.
    # 0.62 pour la version « maskable » : Android peut rogner jusqu'aux 20 %
    # extérieurs pour appliquer sa propre forme.
    for chemin, taille, occupation in [
        ("app/icon.png", 512, 0.92),
        ("app/apple-icon.png", 180, 0.92),
        ("public/icon-192.png", 192, 0.92),
        ("public/icon-512.png", 512, 0.92),
        ("public/icon-maskable-512.png", 512, 0.62),
    ]:
        icone(perso, taille, occupation).save(RACINE / chemin)
        print(chemin)


if __name__ == "__main__":
    main()
