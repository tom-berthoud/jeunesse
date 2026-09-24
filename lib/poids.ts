// Poids d'une séance : combien de présences elle vaut (migration 0002).
// La base accepte tout multiple de 0,5 jusqu'à 5 ; l'interface propose ceux-ci.

export const POIDS = ["0.5", "1", "2"] as const;

export type Poids = (typeof POIDS)[number];

export const POIDS_DEFAUT: Poids = "1";

export const OPTIONS_POIDS = POIDS.map((valeur) => ({ valeur, label: valeur }));

export function estPoids(v: unknown): v is Poids {
  return typeof v === "string" && (POIDS as readonly string[]).includes(v);
}

/** Poids venu de la base → valeur du choix correspondant. */
export function valeurPoids(n: number): Poids {
  const s = String(n);
  return estPoids(s) ? s : POIDS_DEFAUT;
}
