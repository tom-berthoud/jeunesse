"use client";

import { useActionState } from "react";
import { enregistrerOptions, supprimerSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { OPTIONS_POIDS, valeurPoids } from "@/lib/poids";
import { Alert, Button, Input, Segments } from "@/components/ui";

export function OptionsSeance({
  id,
  remarque,
  poids,
  auteur,
  peutSupprimer,
}: {
  id: string;
  remarque: string | null;
  poids: number;
  auteur: string | null;
  peutSupprimer: boolean;
}) {
  const [etat, enregistrer, enregistrement] = useActionState(enregistrerOptions, ETAT_INITIAL);
  const [etatSup, supprimer, suppression] = useActionState(supprimerSeance, ETAT_INITIAL);

  return (
    <div className="space-y-6">
      <form action={enregistrer} className="card space-y-3 p-4">
        <input type="hidden" name="id" value={id} />
        <div className="space-y-1.5">
          <p className="px-1 text-xs font-medium text-ink-muted">Compte pour</p>
          <Segments name="poids" options={OPTIONS_POIDS} defaut={valeurPoids(poids)} />
        </div>
        <Input name="remarque" defaultValue={remarque ?? ""} placeholder="Remarque" aria-label="Remarque" maxLength={200} />
        {etat.erreur && <Alert>{etat.erreur}</Alert>}
        <Button disabled={enregistrement} className="w-full">
          Enregistrer
        </Button>
      </form>

      {auteur && <p className="px-1 text-xs text-ink-faint">Créée par {auteur}</p>}

      {peutSupprimer && (
        <form
          action={supprimer}
          onSubmit={(e) => {
            if (!confirm("Supprimer cette séance et toutes ses présences ?")) e.preventDefault();
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={id} />
          {etatSup.erreur && <Alert>{etatSup.erreur}</Alert>}
          <Button variant="danger" disabled={suppression} className="w-full">
            Supprimer la séance
          </Button>
        </form>
      )}
    </div>
  );
}
