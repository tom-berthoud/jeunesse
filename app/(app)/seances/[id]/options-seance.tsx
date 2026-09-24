"use client";

import { useActionState } from "react";
import { enregistrerOptions, supprimerSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { OPTIONS_POIDS, valeurPoids } from "@/lib/poids";
import { Alert, Button, Input, Repli, Segments } from "@/components/ui";

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
    <Repli entete={<span className="text-sm font-medium text-ink-muted">Options</span>}>
      <form action={enregistrer} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <div className="space-y-1.5">
          <p className="px-1 text-xs font-medium text-ink-muted">Compte pour</p>
          <Segments name="poids" options={OPTIONS_POIDS} defaut={valeurPoids(poids)} />
        </div>
        <div className="flex gap-2">
          <Input name="remarque" defaultValue={remarque ?? ""} placeholder="Remarque" maxLength={200} />
          <Button variant="outline" disabled={enregistrement}>OK</Button>
        </div>
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
