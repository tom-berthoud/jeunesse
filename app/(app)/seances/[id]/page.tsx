import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { dateLongue } from "@/lib/dates";
import { SlidersHorizontal } from "lucide-react";
import { IconLink, PageHeader, Pill, PoidsBadge } from "@/components/ui";
import { Saisie } from "./saisie";

export default async function Seance({ params }: PageProps<"/seances/[id]">) {
  const { id } = await params;
  const { supabase } = await requireComite();

  const [{ data: seance }, { data: membres }, { data: presences }] = await Promise.all([
    supabase
      .from("seances")
      .select("id, date, poids, categorie:categories(libelle, couleur)")
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
        title={dateLongue(seance.date)}
        actions={
          <>
            <PoidsBadge poids={seance.poids} />
            <Pill color={seance.categorie?.couleur ?? "#6b7280"} className="text-sm">
              {seance.categorie?.libelle}
            </Pill>
            <IconLink href={`/seances/${seance.id}/options`} aria-label="Options de la séance" className="-mr-2">
              <SlidersHorizontal size={20} />
            </IconLink>
          </>
        }
      />

      <Saisie seanceId={seance.id} date={seance.date} membres={liste} presents={presents} />
    </div>
  );
}
