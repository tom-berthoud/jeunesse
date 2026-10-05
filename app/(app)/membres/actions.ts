"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireComite } from "@/lib/auth";
import { messageErreur, type EtatAction } from "@/lib/action";
import { normaliser } from "@/lib/texte";

const membre = z.object({
  prenom: z.string().trim().min(1, "Le prénom est obligatoire.").max(60),
  nom: z.string().trim().min(1, "Le nom est obligatoire.").max(60),
  statut: z.enum(["actif", "passif"]),
});

type Supabase = Awaited<ReturnType<typeof requireComite>>["supabase"];
type Nom = { prenom: string; nom: string };

/** Clé de comparaison d'un nom : sans casse, accents ni espaces en trop (« zoé  Rey » = « Zoe Rey »). */
const cle = ({ prenom, nom }: Nom) => normaliser(`${prenom} ${nom}`.replace(/\s+/g, " "));

/**
 * Membres existants par clé de nom, anciens membres compris : un doublon
 * partagerait les présences d'une personne entre deux fiches. Vérifié ici
 * plutôt qu'en base, faute de comparaison sans accents indexable simplement ;
 * deux ajouts simultanés du même nom restent possibles, mais improbables.
 */
async function existants(supabase: Supabase, saufId?: string) {
  const { data, error } = await supabase.from("membres").select("id, prenom, nom, archive");
  if (error) return { erreur: messageErreur(error) };
  return { parCle: new Map(data.filter((m) => m.id !== saufId).map((m) => [cle(m), m])) };
}

function messageDoublon(m: Nom & { archive: boolean }) {
  return m.archive
    ? `${m.prenom} ${m.nom} existe déjà parmi les anciens membres : modifie sa fiche pour la réactiver.`
    : `${m.prenom} ${m.nom} existe déjà.`;
}

export async function creerMembre(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const { supabase } = await requireComite();
  const parsed = membre.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };

  const ex = await existants(supabase);
  if ("erreur" in ex) return ex;
  const doublon = ex.parCle.get(cle(parsed.data));
  if (doublon) return { erreur: messageDoublon(doublon) };

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

  const ex = await existants(supabase);
  if ("erreur" in ex) return ex;
  const vus = new Set<string>();
  const enDouble = [];
  const dejaLa = [];
  for (const m of membres) {
    const k = cle(m);
    if (vus.has(k)) enDouble.push(`${m.prenom} ${m.nom}`);
    else if (ex.parCle.has(k)) dejaLa.push(`${m.prenom} ${m.nom}`);
    vus.add(k);
  }
  if (enDouble.length) return { erreur: `Deux fois dans la liste : ${enDouble.join(", ")}.` };
  if (dejaLa.length) return { erreur: `Existe déjà : ${dejaLa.join(", ")}. Retire ces lignes ; rien n'a été ajouté.` };

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

  // Renommer en quelqu'un qui existe déjà créerait le même doublon.
  const ex = await existants(supabase, id.data);
  if ("erreur" in ex) return ex;
  const doublon = ex.parCle.get(cle(parsed.data));
  if (doublon) return { erreur: messageDoublon(doublon) };

  const { error } = await supabase
    .from("membres")
    .update({ ...parsed.data, archive: formData.get("archive") === "on" })
    .eq("id", id.data);
  if (error) return { erreur: messageErreur(error) };
  revalidatePath("/", "layout");
  redirect(`/membres/${id.data}`);
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
