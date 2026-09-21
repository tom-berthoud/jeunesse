import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { dateLongue } from "@/lib/dates";
import { PageHeader, Pill } from "@/components/ui";
import { Saisie } from "./saisie";
import { OptionsSeance } from "./options-seance";

export default async function Seance({ params }: PageProps<"/seances/[id]">) {
  const { id } = await params;
  const { supabase, userId, profile } = await requireComite();

  const [{ data: seance }, { data: membres }, { data: presences }] = await Promise.all([
    supabase
      .from("seances")
      .select("id, date, remarque, created_by, categorie:categories(libelle, couleur), auteur:profiles(nom)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("membres").select("id, prenom, nom, statut, archive").order("prenom").order("nom"),
    supabase.from("presences").select("membre_id").eq("seance_id", id),
  ]);
  if (!seance) notFound();

  const presents = (presences ?? []).map((p) => p.membre_id);
  const presentsSet = new Set(presents);
  // Un membre archivé reste visible là où il était présent, sinon l'historique
  // afficherait un compteur sans le nom correspondant.
  const liste = (membres ?? []).filter((m) => !m.archive || presentsSet.has(m.id));

  return (
    <div className="space-y-4">
      <PageHeader
        back={`/jour/${seance.date}`}
        title={
          <span className="flex items-center gap-2">
            <Pill color={seance.categorie?.couleur ?? "#6b7280"} className="text-sm">
              {seance.categorie?.libelle}
            </Pill>
          </span>
        }
        subtitle={<span className="capitalize">{dateLongue(seance.date)}</span>}
      />

      <Saisie seanceId={seance.id} membres={liste} presents={presents} />

      <OptionsSeance
        id={seance.id}
        remarque={seance.remarque}
        auteur={seance.auteur?.nom ?? null}
        peutSupprimer={profile.role === "admin" || seance.created_by === userId}
      />
    </div>
  );
}
