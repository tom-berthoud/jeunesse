"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
  suite: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "E-mail ou mot de passe manquant." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Message volontairement vague : ne pas révéler si l'adresse existe.
  if (error) return { error: "E-mail ou mot de passe incorrect." };

  // Chemin interne uniquement : « //site.ch » serait une redirection externe.
  const suite = parsed.data.suite;
  redirect(suite?.startsWith("/") && !suite.startsWith("//") ? suite : "/");
}
