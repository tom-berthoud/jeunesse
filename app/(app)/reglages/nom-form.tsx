"use client";

import { useActionState } from "react";
import { changerNom } from "./actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Input } from "@/components/ui";

export function NomForm({ nom }: { nom: string }) {
  const [etat, action, pending] = useActionState(changerNom, ETAT_INITIAL);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <Input name="nom" defaultValue={nom} required maxLength={60} aria-label="Nom" placeholder="Nom" />
        <Button variant="outline" disabled={pending}>OK</Button>
      </div>
      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
    </form>
  );
}
