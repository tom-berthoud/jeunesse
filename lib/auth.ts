import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export type Session = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string;
  profile: Tables<"profiles"> | null;
};

/**
 * Utilisateur connecté et son profil. `profile` est null si le compte n'est
 * pas (ou plus) membre actif du comité : la RLS lui cache alors sa propre ligne.
 * Mis en cache pour la durée d'une requête (layout + page).
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, userId: user.id, email: user.email ?? "", profile };
});

/**
 * Garde-fou de chaque page et Server Action. proxy.ts ne fait qu'un contrôle
 * optimiste ; la RLS reste la barrière finale.
 */
export async function requireComite() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Pas /login : le proxy y renvoie les connectés vers « / », d'où une boucle.
  if (!session.profile) redirect("/desactive");
  return { ...session, profile: session.profile };
}

export async function requireAdmin() {
  const session = await requireComite();
  if (session.profile.role !== "admin") redirect("/");
  return session;
}
