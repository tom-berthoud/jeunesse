"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { estDate } from "@/lib/dates";
import { messageErreur, type EtatAction } from "@/lib/action";

const uuid = z.uuid();
const date = z.string().refine(estDate, "Date invalide.");

/**
 * Ouvre la séance (date, catégorie), en la créant si besoin. `on conflict do
 * nothing` + relecture : deux membres du comité qui l'ouvrent en même temps
 * tombent sur la même séance.
 */
async function ouvrir(supabase: Awaited<ReturnType<typeof requireComite>>["supabase"], d: string, categorieId: string) {
  const { error } = await supabase
    .from("seances")
    .upsert({ date: d, categorie_id: categorieId }, { onConflict: "date,categorie_id", ignoreDuplicates: true });
  if (error) return { erreur: messageErreur(error) };

  const { data, error: e2 } = await supabase
    .from("seances")
    .select("id")
    .eq("date", d)
    .eq("categorie_id", categorieId)
    .single();
  if (e2 || !data) return { erreur: "Séance introuvable après création." };
  return { id: data.id };
}

export async function ouvrirSeance(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const d = date.safeParse(formData.get("date"));
  const c = uuid.safeParse(formData.get("categorie_id"));
  if (!d.success || !c.success) return { erreur: "Données invalides." };

  const r = await ouvrir(supabase, d.data, c.data);
  if ("erreur" in r) return { erreur: r.erreur };
  revalidatePath("/", "layout");
  redirect(`/seances/${r.id}`);
}

/** Crée une catégorie depuis la page d'un jour et ouvre directement sa séance. */
export async function creerCategorieEtSeance(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const d = date.safeParse(formData.get("date"));
  const libelle = String(formData.get("libelle") ?? "").trim();
  const couleur = String(formData.get("couleur") ?? "");
  if (!d.success) return { erreur: "Date invalide." };
  if (!libelle) return { erreur: "Donne un nom à la catégorie." };
  if (!/^#[0-9a-fA-F]{6}$/.test(couleur)) return { erreur: "Couleur invalide." };

  const { data: cat, error } = await supabase
    .from("categories")
    .insert({ libelle, couleur })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { erreur: `La catégorie « ${libelle} » existe déjà.` };
    return { erreur: messageErreur(error) };
  }

  const r = await ouvrir(supabase, d.data, cat.id);
  if ("erreur" in r) return { erreur: r.erreur };
  revalidatePath("/", "layout");
  redirect(`/seances/${r.id}`);
}

/** Cocher (present = true) ou décocher une personne. */
export async function basculerPresence(
  seanceId: string,
  membreId: string,
  present: boolean,
): Promise<{ erreur?: string }> {
  const { supabase } = await requireComite();
  if (!uuid.safeParse(seanceId).success || !uuid.safeParse(membreId).success) {
    return { erreur: "Données invalides." };
  }

  // ignoreDuplicates : cocher deux fois (deux téléphones) n'est pas une erreur.
  const { error } = present
    ? await supabase
        .from("presences")
        .upsert({ seance_id: seanceId, membre_id: membreId }, { ignoreDuplicates: true })
    : await supabase.from("presences").delete().eq("seance_id", seanceId).eq("membre_id", membreId);

  if (error) return { erreur: messageErreur(error) };
  revalidatePath(`/seances/${seanceId}`);
  return {};
}

export async function enregistrerRemarque(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { erreur: "Données invalides." };
  const remarque = String(formData.get("remarque") ?? "").trim() || null;

  const { error } = await supabase.from("seances").update({ remarque }).eq("id", id.data);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath(`/seances/${id.data}`);
  return { ok: "Remarque enregistrée." };
}

export async function supprimerSeance(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { erreur: "Données invalides." };

  // La RLS filtre silencieusement : 0 ligne supprimée = pas le droit.
  const { data, error } = await supabase.from("seances").delete().eq("id", id.data).select("date");
  if (error) return { erreur: messageErreur(error) };
  if (!data.length) return { erreur: "Seul l'auteur de la séance ou un admin peut la supprimer." };

  revalidatePath("/", "layout");
  redirect(`/jour/${data[0].date}`);
}
