"use client";

import { useActionState } from "react";
import { ajouterListe } from "../actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button } from "@/components/ui";

export function AjoutListe() {
  const [etat, action, pending] = useActionState(ajouterListe, ETAT_INITIAL);

  return (
    <details className="card">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 text-sm font-medium">
        Ajouter une liste d&apos;un coup
      </summary>
      <form action={action} key={etat.ok} className="space-y-3 border-t border-line p-4">
        <p className="text-xs text-ink-muted">
          Une personne par ligne, prénom et nom séparés par un point-virgule. Ajoute{" "}
          <code>; passif</code> pour un membre passif.
        </p>
        <textarea
          name="liste"
          rows={8}
          placeholder={"Léa ; Pittet\nLucas ; Genoud\nJulie ; Maillard ; passif"}
          className="w-full rounded-lg border border-line bg-surface p-3 font-mono text-base focus-brand"
        />
        {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
        {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
        <Button disabled={pending} className="w-full">
          {pending ? "Ajout…" : "Ajouter la liste"}
        </Button>
      </form>
    </details>
  );
}
