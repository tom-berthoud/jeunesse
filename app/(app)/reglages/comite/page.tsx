import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { motDePasseProvisoire } from "@/lib/mdp";
import { PageHeader } from "@/components/ui";
import { CompteCard, NouveauCompte } from "./comptes";

export default async function Comite() {
  const { userId } = await requireAdmin();
  const admin = createAdminClient();

  const [{ data: users, error }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin.from("profiles").select("*").order("actif", { ascending: false }).order("nom"),
  ]);
  if (error) throw new Error(error.message);
  const parId = new Map(users.users.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <PageHeader
        back="/reglages"
        title="Comptes du comité"
        subtitle="Pas d'e-mail envoyé : transmets toi-même l'adresse et le mot de passe provisoire."
      />
      <div className="space-y-2">
        {profiles?.map((p) => (
          <CompteCard
            key={p.id}
            profil={p}
            email={parId.get(p.id)?.email ?? "—"}
            derniereConnexion={parId.get(p.id)?.last_sign_in_at ?? null}
            estMoi={p.id === userId}
            mdpSuggere={motDePasseProvisoire()}
          />
        ))}
      </div>
      <NouveauCompte mdpSuggere={motDePasseProvisoire()} />
    </div>
  );
}
