"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { messageErreur, type EtatAction } from "@/lib/action";

const categorie = z.object({
  libelle: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
  couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide."),
});

export async function creerCategorie(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const parsed = categorie.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { error } = await supabase.from("categories").insert(parsed.data);
  if (error?.code === "23505") return { erreur: `« ${parsed.data.libelle} » existe déjà.` };
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: "Catégorie créée." };
}

export async function modifierCategorie(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = categorie.safeParse(Object.fromEntries(formData));
  if (!id.success) return { erreur: "Données invalides." };
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("categories")
    .update({ ...parsed.data, archivee: formData.get("archivee") === "on" })
    .eq("id", id.data);
  if (error?.code === "23505") return { erreur: `« ${parsed.data.libelle} » existe déjà.` };
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: "Enregistré." };
}

export async function supprimerCategorie(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erreur: "Données invalides." };

  const { data, error } = await supabase.from("categories").delete().eq("id", id.data).select("id");
  if (error?.code === "23503") return { erreur: "Des séances utilisent cette catégorie : archive-la plutôt." };
  if (error) return { erreur: messageErreur(error) };
  if (!data.length) return { erreur: "Seul un admin peut supprimer une catégorie." };
  revalidatePath("/", "layout");
  return { ok: "Catégorie supprimée." };
}
