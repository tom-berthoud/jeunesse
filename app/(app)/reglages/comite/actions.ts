"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EtatAction } from "@/lib/action";

// Toutes ces actions utilisent la clé secrète (contourne la RLS) :
// requireAdmin() en première ligne, sans exception.

const BAN_PERMANENT = "876000h"; // 100 ans : Supabase n'a pas de bannissement illimité

export async function creerCompte(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  await requireAdmin();
  const parsed = z
    .object({
      nom: z.string().trim().min(1, "Le nom est obligatoire.").max(60),
      email: z.email("Adresse e-mail invalide.").transform((e) => e.toLowerCase()),
      password: z.string().min(8, "Mot de passe provisoire : 8 caractères au minimum."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { erreur: parsed.error.issues[0].message };
  const { nom, email, password } = parsed.data;

  // Le déclencheur on_auth_user_created crée le profil (rôle comite,
  // doit_changer_mdp = true) à partir de user_metadata.nom.
  const { error } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom },
  });
  if (error) {
    if (error.code === "email_exists") return { erreur: "Un compte existe déjà avec cette adresse." };
    console.error("creerCompte:", error.code, error.message);
    return { erreur: "La création a échoué." };
  }

  revalidatePath("/reglages/comite");
  return { ok: `Compte créé. À transmettre à ${nom} : ${email} / ${password}` };
}

const cible = z.object({ id: z.uuid() });

/** Refuse qu'un admin se retire lui-même ses droits : il pourrait ne plus rester personne. */
async function autreQueSoi(formData: FormData) {
  const { userId } = await requireAdmin();
  const p = cible.safeParse(Object.fromEntries(formData));
  if (!p.success) return { erreur: "Données invalides." } as const;
  if (p.data.id === userId) return { erreur: "Impossible sur ton propre compte." } as const;
  return { id: p.data.id } as const;
}

export async function changerRole(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const c = await autreQueSoi(formData);
  if ("erreur" in c) return c;
  const role = formData.get("role") === "admin" ? "admin" : "comite";

  const { error } = await createAdminClient().from("profiles").update({ role }).eq("id", c.id);
  if (error) return { erreur: "La modification a échoué." };
  revalidatePath("/reglages/comite");
  return { ok: role === "admin" ? "Passé admin." : "Passé membre du comité." };
}

export async function changerActivation(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const c = await autreQueSoi(formData);
  if ("erreur" in c) return c;
  const actif = formData.get("actif") === "true";
  const admin = createAdminClient();

  // Deux verrous : le profil (la RLS ne lui montre plus rien) et le
  // bannissement (plus de connexion ni de renouvellement de jeton).
  const { error } = await admin.from("profiles").update({ actif }).eq("id", c.id);
  if (error) return { erreur: "La modification a échoué." };
  const { error: e2 } = await admin.auth.admin.updateUserById(c.id, {
    ban_duration: actif ? "none" : BAN_PERMANENT,
  });
  if (e2) {
    console.error("activation:", e2.code, e2.message);
    return { erreur: "Profil modifié, mais le blocage de connexion a échoué. Réessaie." };
  }
  revalidatePath("/reglages/comite");
  return { ok: actif ? "Compte réactivé." : "Compte désactivé." };
}

export async function reinitialiserMotDePasse(_prev: EtatAction, formData: FormData): Promise<EtatAction> {
  const c = await autreQueSoi(formData);
  if ("erreur" in c) return c;
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { erreur: "8 caractères au minimum." };
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(c.id, { password });
  if (error) {
    console.error("reinit:", error.code, error.message);
    return { erreur: "La réinitialisation a échoué." };
  }
  await admin.from("profiles").update({ doit_changer_mdp: true }).eq("id", c.id);
  revalidatePath("/reglages/comite");
  return { ok: `Nouveau mot de passe provisoire : ${password}` };
}
