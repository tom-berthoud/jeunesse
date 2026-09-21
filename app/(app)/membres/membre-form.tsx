"use client";

import { useActionState } from "react";
import { creerMembre, modifierMembre } from "./actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Input, Segments } from "@/components/ui";
import type { StatutMembre } from "@/lib/types/database";

type Membre = { id: string; prenom: string; nom: string; statut: StatutMembre; archive: boolean };

const STATUTS = [
  { valeur: "actif", label: "Actif" },
  { valeur: "passif", label: "Passif" },
] as const;

export function MembreForm({ membre }: { membre?: Membre }) {
  const [etat, action, pending] = useActionState(membre ? modifierMembre : creerMembre, ETAT_INITIAL);

  return (
    // key : vide le formulaire après chaque ajout réussi.
    <form action={action} key={membre ? undefined : etat.ok} className="card space-y-3 p-4">
      {membre && <input type="hidden" name="id" value={membre.id} />}
      <div className="grid grid-cols-2 gap-2">
        <Input name="prenom" defaultValue={membre?.prenom} placeholder="Prénom" aria-label="Prénom" required maxLength={60} autoComplete="off" />
        <Input name="nom" defaultValue={membre?.nom} placeholder="Nom" aria-label="Nom" required maxLength={60} autoComplete="off" />
      </div>
      <Segments name="statut" options={STATUTS} defaut={membre?.statut ?? "actif"} />

      {membre && (
        <label className="flex min-h-11 items-center gap-3 px-1 text-sm">
          <input type="checkbox" name="archive" defaultChecked={membre.archive} className="size-5 accent-primary" />
          Ancien membre
        </label>
      )}

      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
      <Button disabled={pending} className="w-full">
        {membre ? "Enregistrer" : "Ajouter"}
      </Button>
    </form>
  );
}
