"use client";

import { useActionState } from "react";
import { changerMotDePasse } from "@/app/(app)/reglages/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { Alert, Button, Input } from "@/components/ui";

export function PasswordForm() {
  const [etat, action, pending] = useActionState(changerMotDePasse, ETAT_INITIAL);

  return (
    <form action={action} key={etat.ok} className="space-y-3">
      <Input name="password" type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" required minLength={8} />
      <Input name="confirmation" type="password" autoComplete="new-password" placeholder="Confirmation" required minLength={8} />
      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
      <Button disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
