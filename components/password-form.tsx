"use client";

import { useActionState } from "react";
import { changerMotDePasse } from "@/app/(app)/reglages/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Field, Input } from "@/components/ui";

export function PasswordForm() {
  const [etat, action, pending] = useActionState(changerMotDePasse, ETAT_INITIAL);

  return (
    <form action={action} className="space-y-3">
      <Field label="Nouveau mot de passe" hint="8 caractères au minimum">
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Confirmation">
        <Input name="confirmation" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
      <Button disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
