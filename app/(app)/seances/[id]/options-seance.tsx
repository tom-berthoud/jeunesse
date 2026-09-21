"use client";

import { useActionState } from "react";
import { enregistrerRemarque, supprimerSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Input } from "@/components/ui";

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
    <details className="card group">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-medium text-ink-muted">
        Remarque et options
      </summary>
      <div className="space-y-4 border-t border-line p-4">
        <form action={enregistrer} className="space-y-2">
          <input type="hidden" name="id" value={id} />
          <Input name="remarque" defaultValue={remarque ?? ""} placeholder="Remarque (facultatif)" maxLength={200} />
          {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
          {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
          <Button variant="outline" disabled={enregistrement} className="w-full">
            Enregistrer la remarque
          </Button>
        </form>

        {auteur && <p className="text-xs text-ink-faint">Créée par {auteur}</p>}

        {peutSupprimer && (
          <form
            action={supprimer}
            onSubmit={(e) => {
              if (!confirm("Supprimer cette séance et toutes ses présences ?")) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            {etatSup.erreur && <Alert tone="danger">{etatSup.erreur}</Alert>}
            <Button variant="danger" disabled={suppression} className="w-full">
              Supprimer la séance
            </Button>
          </form>
        )}
      </div>
    </details>
  );
}
