// Dates civiles en chaînes "YYYY-MM-DD". Aucun objet Date local en logique
// métier : Vercel tourne en UTC, un `new Date()` naïf décalerait le jour entre
// minuit et 2 h du matin à Châtel.

const TZ = "Europe/Zurich";

export type Mois = { annee: number; mois: number }; // mois : 1–12

/** Date du jour à Zurich. */
export function aujourdhui(): string {
  // en-CA formate en YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function estDate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, j] = s.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

function iso(a: number, m: number, j: number) {
  return `${a}-${String(m).padStart(2, "0")}-${String(j).padStart(2, "0")}`;
}

export function moisDe(date: string): Mois {
  const [annee, mois] = date.split("-").map(Number);
  return { annee, mois };
}

export function parseMois(s: unknown): Mois | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}$/.test(s)) return null;
  const [annee, mois] = s.split("-").map(Number);
  return mois >= 1 && mois <= 12 ? { annee, mois } : null;
}

export function formatMoisParam({ annee, mois }: Mois) {
  return `${annee}-${String(mois).padStart(2, "0")}`;
}

export function decalerMois({ annee, mois }: Mois, delta: number): Mois {
  const index = annee * 12 + (mois - 1) + delta;
  return { annee: Math.floor(index / 12), mois: (index % 12) + 1 };
}

export function joursDansMois({ annee, mois }: Mois) {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate();
}

export function premierJour(m: Mois) {
  return iso(m.annee, m.mois, 1);
}

export function dernierJour(m: Mois) {
  return iso(m.annee, m.mois, joursDansMois(m));
}

/**
 * Grille du calendrier, semaines commençant le lundi. Les cases hors du mois
 * valent null.
 */
export function grilleMois(m: Mois): (string | null)[][] {
  const lundiIndex = (new Date(Date.UTC(m.annee, m.mois - 1, 1)).getUTCDay() + 6) % 7;
  const cases: (string | null)[] = Array(lundiIndex).fill(null);
  for (let j = 1; j <= joursDansMois(m); j++) cases.push(iso(m.annee, m.mois, j));
  while (cases.length % 7) cases.push(null);
  const semaines = [];
  for (let i = 0; i < cases.length; i += 7) semaines.push(cases.slice(i, i + 7));
  return semaines;
}

function versDate(date: string) {
  const [a, m, j] = date.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

const fmtLong = new Intl.DateTimeFormat("fr-CH", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const fmtCourt = new Intl.DateTimeFormat("fr-CH", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const fmtMois = new Intl.DateTimeFormat("fr-CH", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

/** Majuscule initiale seulement : CSS `capitalize` donnerait « 3 Octobre ». */
const initiale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « Samedi 3 octobre 2026 » */
export const dateLongue = (date: string) => initiale(fmtLong.format(versDate(date)));
/** « Sam. 3 oct. » */
export const dateCourte = (date: string) => initiale(fmtCourt.format(versDate(date)));
/** « Octobre 2026 » */
export const nomMois = (m: Mois) => initiale(fmtMois.format(new Date(Date.UTC(m.annee, m.mois - 1, 1))));
/** « 3.10.2026 » */
export const dateNumerique = (date: string) => date.split("-").map(Number).reverse().join(".");
export const jourDuMois = (date: string) => Number(date.slice(8));

export function decalerJour(date: string, delta: number): string {
  const d = versDate(date);
  d.setUTCDate(d.getUTCDate() + delta);
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}
