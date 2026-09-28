"use client";

import { useActionState } from "react";
import { supprimerMembre } from "../../actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button } from "@/components/ui";

/** Affiché seulement sans présence : sinon on archive, pour garder l'historique. */
export function SupprimerMembre({ id }: { id: string }) {
  const [etat, action, pending] = useActionState(supprimerMembre, ETAT_INITIAL);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement ce membre ?")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      <Button variant="danger" disabled={pending} className="w-full">
        Supprimer ce membre
      </Button>
    </form>
  );
}
