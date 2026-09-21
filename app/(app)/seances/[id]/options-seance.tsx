"use client";

import { useActionState } from "react";
import { enregistrerRemarque, supprimerSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Input, Repli } from "@/components/ui";

export function OptionsSeance({
  id,
  remarque,
  auteur,
  peutSupprimer,
}: {
  id: string;
  remarque: string | null;
  auteur: string | null;
  peutSupprimer: boolean;
}) {
  const [etat, enregistrer, enregistrement] = useActionState(enregistrerRemarque, ETAT_INITIAL);
  const [etatSup, supprimer, suppression] = useActionState(supprimerSeance, ETAT_INITIAL);

  return (
    <Repli entete={<span className="text-sm font-medium text-ink-muted">Options</span>}>
      <form action={enregistrer} className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="remarque" defaultValue={remarque ?? ""} placeholder="Remarque" maxLength={200} />
        <Button variant="outline" disabled={enregistrement}>OK</Button>
      </form>
      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}

      {auteur && <p className="text-xs text-ink-faint">Créée par {auteur}</p>}

      {peutSupprimer && (
        <form
          action={supprimer}
          onSubmit={(e) => {
            if (!confirm("Supprimer cette séance et toutes ses présences ?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          {etatSup.erreur && <Alert>{etatSup.erreur}</Alert>}
          <Button variant="danger" disabled={suppression} className="w-full">
            Supprimer la séance
          </Button>
        </form>
      )}
    </Repli>
  );
}
