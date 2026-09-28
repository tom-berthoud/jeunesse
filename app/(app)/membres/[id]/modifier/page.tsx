import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { MembreForm } from "../../membre-form";
import { SupprimerMembre } from "./supprimer";

export default async function ModifierMembre({ params }: PageProps<"/membres/[id]/modifier">) {
  const { id } = await params;
  const { supabase, profile } = await requireComite();

  const [{ data: membre }, { count }] = await Promise.all([
    supabase.from("membres").select("id, prenom, nom, statut, archive").eq("id", id).maybeSingle(),
    supabase.from("presences").select("*", { count: "exact", head: true }).eq("membre_id", id),
  ]);
  if (!membre) notFound();

  return (
    <div className="space-y-6">
      <PageHeader back={`/membres/${membre.id}`} title={`${membre.prenom} ${membre.nom}`} />
      <MembreForm membre={membre} />
      {profile.role === "admin" && count === 0 && <SupprimerMembre id={membre.id} />}
    </div>
  );
}
