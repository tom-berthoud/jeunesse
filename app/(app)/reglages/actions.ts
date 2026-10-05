"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { messageErreur, type EtatAction } from "@/lib/action";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

const motDePasse = z
  .object({
    password: z.string().min(8, "8 caractères au minimum."),
    confirmation: z.string(),
  })
  .refine((v) => v.password === v.confirmation, "Les deux mots de passe ne correspondent pas.");

export async function changerMotDePasse(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase, userId } = await requireComite();
  const parsed = motDePasse.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { erreur: "Choisis un mot de passe différent de l'actuel." };
    if (error.code === "weak_password") return { erreur: "Mot de passe trop faible." };
    console.error("mdp:", error.code, error.message);
    return { erreur: "Le changement a échoué. Réessaie." };
  }

  await supabase.from("profiles").update({ doit_changer_mdp: false }).eq("id", userId);
  revalidatePath("/", "layout");
  return { ok: "Mot de passe modifié." };
}

export async function changerNom(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase, userId } = await requireComite();
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { erreur: "Le nom est obligatoire." };
  if (nom.length > 60) return { erreur: "60 caractères au maximum." };

  const { error } = await supabase.from("profiles").update({ nom }).eq("id", userId);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: "Nom enregistré." };
}

export async function changerTheme(theme: Theme) {
  const store = await cookies();
  if (theme === "system") store.delete(THEME_COOKIE);
  else store.set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
