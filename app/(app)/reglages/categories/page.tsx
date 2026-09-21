import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { CategorieForm, NouvelleCategorie } from "./categorie-form";

export default async function Categories() {
  const { supabase, profile } = await requireComite();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, libelle, couleur, archivee, seances(count)")
    .order("archivee")
    .order("ordre")
    .order("libelle");

  return (
    <div className="space-y-3">
      <PageHeader back="/reglages" title="Catégories" />
      {categories?.map((c) => (
        <CategorieForm key={c.id} categorie={c} nbSeances={c.seances[0]?.count ?? 0} admin={profile.role === "admin"} />
      ))}
      <NouvelleCategorie />
    </div>
  );
}
