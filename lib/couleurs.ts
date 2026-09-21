/**
 * Couleur de texte lisible sur un fond donné (#rrggbb). Luminance relative
 * WCAG ; seuil 0.4 plutôt que 0.5 parce que le blanc reste lisible sur des
 * tons moyens (orange, violet) où le noir paraît lourd.
 */
export function texteSur(fond: string): "#000000" | "#ffffff" {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(fond.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return l > 0.4 ? "#000000" : "#ffffff";
}

/** Proposées à la création d'une catégorie. */
export const PALETTE = [
  "#b45309", "#7c3aed", "#0f766e", "#be123c",
  "#1d4ed8", "#4d7c0f", "#c2410c", "#475569",
];
