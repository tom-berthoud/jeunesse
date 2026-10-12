import { z } from "zod";
import { aujourdhui, estDate } from "@/lib/dates";

export type ParamsClassement = {
  annee?: string;
  debut?: string;
  fin?: string;
  categorie?: string;
  statut?: string;
  archives?: string;
};

/**
 * Filtres du classement lus depuis l'URL : partagés par la page et l'export
 * CSV, pour que le fichier contienne exactement ce qui est affiché.
 */
export function lireFiltres(sp: ParamsClassement) {
  const anneeCourante = Number(aujourdhui().slice(0, 4));

  // Période : une année civile, tout, ou deux dates libres. Les bornes
  // personnalisées restent dans l'URL même quand une année est choisie, pour
  // les retrouver en revenant sur « Dates ».
  const mode =
    sp.annee === "tout" || sp.annee === "perso" ? sp.annee
    : /^\d{4}$/.test(sp.annee ?? "") ? sp.annee!
    : String(anneeCourante);
  const debut = estDate(sp.debut) ? sp.debut : `${anneeCourante}-01-01`;
  const fin = estDate(sp.fin) ? sp.fin : aujourdhui();
  const periode =
    mode === "tout" ? { debut: "1900-01-01", fin: "2999-12-31" }
    : mode === "perso" ? (debut <= fin ? { debut, fin } : { debut: fin, fin: debut })
    : { debut: `${mode}-01-01`, fin: `${mode}-12-31` };

  return {
    anneeCourante,
    mode,
    debut,
    fin,
    periode,
    categorie: z.uuid().safeParse(sp.categorie).success ? sp.categorie! : "",
    statut: sp.statut === "actif" || sp.statut === "passif" ? sp.statut : "",
    archives: sp.archives === "1",
  };
}

/**
 * Filtres en query string, pour les transmettre tels quels : export CSV, fiche
 * d'un membre et retour au classement.
 */
export function requeteClassement(sp: ParamsClassement) {
  return new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string"),
  ).toString();
}

/** Rang « sportif » : ex æquo au même rang, le suivant saute (1, 2, 2, 4). Lignes triées. */
export function rangs(lignes: { presences: number }[]) {
  return lignes.map((m) => lignes.findIndex((x) => x.presences === m.presences) + 1);
}
