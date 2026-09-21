"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Alert, Button, Input } from "@/components/ui";

export function LoginForm({ suite }: { suite?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Input name="email" type="email" autoComplete="email" placeholder="E-mail" required />
      <Input name="password" type="password" autoComplete="current-password" placeholder="Mot de passe" required />
      {state.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending} className="mt-1">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
