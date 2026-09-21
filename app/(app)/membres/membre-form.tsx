"use client";

import { useActionState } from "react";
import { creerMembre, modifierMembre } from "./actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, cn, Field, Input } from "@/components/ui";
import type { StatutMembre } from "@/lib/types/database";

type Membre = { id: string; prenom: string; nom: string; statut: StatutMembre; archive: boolean };

export function MembreForm({ membre }: { membre?: Membre }) {
  const [etat, action, pending] = useActionState(membre ? modifierMembre : creerMembre, ETAT_INITIAL);

  return (
    // key : vide le formulaire après chaque ajout réussi.
    <form action={action} key={membre ? undefined : etat.ok} className="card space-y-3 p-4">
      {membre && <input type="hidden" name="id" value={membre.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom">
          <Input name="prenom" defaultValue={membre?.prenom} required maxLength={60} autoComplete="off" />
        </Field>
        <Field label="Nom">
          <Input name="nom" defaultValue={membre?.nom} required maxLength={60} autoComplete="off" />
        </Field>
      </div>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-1.5 text-xs font-medium text-ink-muted">Statut</legend>
        {(["actif", "passif"] as const).map((s) => (
          <label
            key={s}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-sm font-medium capitalize",
              "has-[:checked]:border-brand has-[:checked]:bg-brand-50 has-[:checked]:text-brand",
            )}
          >
            <input type="radio" name="statut" value={s} defaultChecked={(membre?.statut ?? "actif") === s} className="sr-only" />
            {s}
          </label>
        ))}
      </fieldset>

      {membre && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="archive" defaultChecked={membre.archive} className="size-5 accent-brand" />
          <span>
            A quitté la jeunesse
            <span className="block text-xs text-ink-faint">Masqué de la saisie, présences conservées</span>
          </span>
        </label>
      )}

      {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
      <Button disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : membre ? "Enregistrer" : "Ajouter"}
      </Button>
    </form>
  );
}
