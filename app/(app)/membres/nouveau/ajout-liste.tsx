"use client";

import { useActionState } from "react";
import { ajouterListe } from "../actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Repli, Textarea } from "@/components/ui";

export function AjoutListe() {
  const [etat, action, pending] = useActionState(ajouterListe, ETAT_INITIAL);

  return (
    <Repli entete={<span className="text-sm font-medium">Ajouter une liste</span>}>
      <form action={action} key={etat.ok} className="space-y-3">
        <Textarea
          name="liste"
          rows={8}
          aria-label="Liste des membres"
          placeholder={"Prénom ; Nom\nLéa ; Pittet\nJulie ; Maillard ; passif"}
          className="font-mono"
        />
        {etat.erreur && <Alert>{etat.erreur}</Alert>}
        {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
        <Button disabled={pending} className="w-full">
          Ajouter
        </Button>
      </form>
    </Repli>
  );
}
