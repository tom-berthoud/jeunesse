import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { MembreForm } from "../membre-form";
import { AjoutListe } from "./ajout-liste";

export default async function NouveauMembre() {
  await requireComite();
  return (
    <div className="space-y-6">
      <PageHeader back="/membres" title="Ajouter" />
      <MembreForm />
      <AjoutListe />
    </div>
  );
}
