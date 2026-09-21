"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { messageErreur, type EtatAction } from "@/lib/action";

const membre = z.object({
  prenom: z.string().trim().min(1, "Le prénom est obligatoire.").max(60),
  nom: z.string().trim().min(1, "Le nom est obligatoire.").max(60),
  statut: z.enum(["actif", "passif"]),
});

export async function creerMembre(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const parsed = membre.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { error } = await supabase.from("membres").insert(parsed.data);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: `${parsed.data.prenom} ${parsed.data.nom} ajouté·e.` };
}

/**
 * Ajout en liste, une personne par ligne : « Prénom ; Nom » ou
 * « Prénom ; Nom ; passif ». Le point-virgule évite de deviner où finit un
 * prénom composé (« Jean-Marc Du Pasquier »). Tout ou rien.
 */
export async function ajouterListe(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const lignes = String(formData.get("liste") ?? "")
    .split(/\r?\n/)
    .map((l, i) => ({ texte: l.trim(), num: i + 1 }))
    .filter((l) => l.texte);
  if (!lignes.length) return { erreur: "La liste est vide." };

  const membres = [];
  const erreurs = [];
  for (const { texte, num } of lignes) {
    const [prenom = "", nom = "", statut = "actif"] = texte.split(";").map((s) => s.trim());
    const p = membre.safeParse({ prenom, nom, statut: statut.toLowerCase() || "actif" });
    if (p.success) membres.push(p.data);
    else erreurs.push(num);
  }
  if (erreurs.length) {
    return { erreur: `Ligne${erreurs.length > 1 ? "s" : ""} ${erreurs.join(", ")} : format attendu « Prénom ; Nom » ou « Prénom ; Nom ; passif ».` };
  }

  const { error } = await supabase.from("membres").insert(membres);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: `${membres.length} membre${membres.length > 1 ? "s" : ""} ajouté${membres.length > 1 ? "s" : ""}.` };
}

export async function modifierMembre(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = z.uuid().safeParse(formData.get("id"));
  const parsed = membre.safeParse(Object.fromEntries(formData));
  if (!id.success) return { erreur: "Données invalides." };
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("membres")
    .update({ ...parsed.data, archive: formData.get("archive") === "on" })
    .eq("id", id.data);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  return { ok: "Enregistré." };
}

export async function supprimerMembre(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { erreur: "Données invalides." };

  const { data, error } = await supabase.from("membres").delete().eq("id", id.data).select("id");
  if (error?.code === "23503") {
    return { erreur: "Cette personne a des présences : archive-la plutôt, pour garder l'historique." };
  }
  if (error) return { erreur: messageErreur(error) };
  if (!data.length) return { erreur: "Seul un admin peut supprimer un membre." };
  revalidatePath("/", "layout");
  redirect("/membres");
}
