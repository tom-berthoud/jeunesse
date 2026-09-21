"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const input = "h-12 rounded-lg border border-zinc-300 px-3 text-base dark:border-zinc-700 dark:bg-zinc-900";

export function LoginForm({ suite }: { suite?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <input name="email" type="email" autoComplete="email" placeholder="E-mail" required className={input} />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Mot de passe"
        required
        className={input}
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="h-12 rounded-lg bg-brand font-medium text-white disabled:opacity-60">
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
