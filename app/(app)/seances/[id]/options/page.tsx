import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { OptionsSeance } from "./options-seance";

export default async function OptionsSeancePage({ params }: PageProps<"/seances/[id]/options">) {
  const { id } = await params;
  const { supabase, userId, profile } = await requireComite();

  const { data: seance } = await supabase
    .from("seances")
    .select("id, remarque, poids, created_by, auteur:profiles(nom)")
    .eq("id", id)
    .maybeSingle();
  if (!seance) notFound();

  return (
    <div>
      <PageHeader back={`/seances/${seance.id}`} title="Options" />
      <OptionsSeance
        id={seance.id}
        remarque={seance.remarque}
        poids={seance.poids}
        auteur={seance.auteur?.nom ?? null}
        peutSupprimer={profile.role === "admin" || seance.created_by === userId}
      />
    </div>
  );
}
