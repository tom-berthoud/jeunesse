/** Retour des Server Actions de formulaire (useActionState). */
export type EtatAction = { erreur?: string; ok?: string };

export const ETAT_INITIAL: EtatAction = {};

/** Message lisible pour les erreurs Postgres / PostgREST les plus courantes. */
export function messageErreur(e: { code?: string; message: string }): string {
  switch (e.code) {
    case "23505":
      return "Cet élément existe déjà.";
    case "23503":
      return "Impossible : cet élément est encore utilisé ailleurs.";
    case "42501":
      return "Tu n'as pas les droits pour cette action.";
    default:
      console.error("action:", e.code, e.message);
      return "L'enregistrement a échoué. Réessaie.";
  }
}
