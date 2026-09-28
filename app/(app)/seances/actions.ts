"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { estDate } from "@/lib/dates";
import { estPoids, POIDS_DEFAUT } from "@/lib/poids";
import { messageErreur, type EtatAction } from "@/lib/action";

const uuid = z.uuid();
const date = z.string().refine(estDate, "Date invalide.");

/** Poids soumis par un formulaire ; toute valeur inattendue retombe sur 1. */
function lirePoids(formData: FormData): number {
  const v = formData.get("poids");
  return Number(estPoids(v) ? v : POIDS_DEFAUT);
}

/**
 * Ouvre la séance (date, catégorie), en la créant si besoin. `on conflict do
 * nothing` + relecture : deux membres du comité qui l'ouvrent en même temps
 * tombent sur la même séance.
 */
async function ouvrir(
  supabase: Awaited<ReturnType<typeof requireComite>>["supabase"],
  d: string,
  categorieId: string,
  poids: number,
) {
  // ignoreDuplicates : si la séance existe déjà, son poids n'est pas écrasé.
  const { error } = await supabase
    .from("seances")
    .upsert({ date: d, categorie_id: categorieId, poids }, { onConflict: "date,categorie_id", ignoreDuplicates: true });
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

  const r = await ouvrir(supabase, d.data, c.data, lirePoids(formData));
  if ("erreur" in r) return { erreur: r.erreur };
  revalidatePath("/", "layout");
  redirect(`/seances/${r.id}`);
}

/**
 * Ouvre une séance d'une catégorie ponctuelle (« Rangement fête ») depuis la
 * page d'un jour. La catégorie est créée déjà archivée : elle n'encombre pas
 * les boutons du jour, réservés aux catégories permanentes (Réglages). Si le
 * nom existe déjà, archivé ou non, on réutilise la catégorie : un deuxième
 * jour de rangement retombe sur la même.
 */
export async function creerCategorieEtSeance(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const d = date.safeParse(formData.get("date"));
  const libelle = String(formData.get("libelle") ?? "").trim();
  const couleur = String(formData.get("couleur") ?? "");
  if (!d.success) return { erreur: "Date invalide." };
  if (!libelle) return { erreur: "Donne un nom à la catégorie." };
  if (!/^#[0-9a-fA-F]{6}$/.test(couleur)) return { erreur: "Couleur invalide." };

  // ilike sans joker : égalité insensible à la casse (« rangement fête » = « Rangement fête »).
  const { data: existante, error: e1 } = await supabase
    .from("categories")
    .select("id")
    .ilike("libelle", libelle.replace(/[\\%_]/g, "\\$&"))
    .order("archivee")
    .limit(1)
    .maybeSingle();
  if (e1) return { erreur: messageErreur(e1) };

  let categorieId = existante?.id;
  if (!categorieId) {
    const { data: cat, error } = await supabase
      .from("categories")
      .insert({ libelle, couleur, archivee: true })
      .select("id")
      .single();
    // Créée entre la recherche et l'insertion (autre téléphone) : réessayer la retrouve.
    if (error?.code === "23505") return { erreur: `« ${libelle} » vient d'être créée : réessaie.` };
    if (error) return { erreur: messageErreur(error) };
    categorieId = cat.id;
  }

  const r = await ouvrir(supabase, d.data, categorieId, lirePoids(formData));
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

export async function enregistrerOptions(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return { erreur: "Données invalides." };
  const remarque = String(formData.get("remarque") ?? "").trim() || null;

  const { error } = await supabase
    .from("seances")
    .update({ remarque, poids: lirePoids(formData) })
    .eq("id", id.data);
  if (error) return { erreur: messageErreur(error) };
  // Le poids change le classement : revalider aussi /membres.
  revalidatePath("/", "layout");
  redirect(`/seances/${id.data}`);
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
