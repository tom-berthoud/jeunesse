import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Mesures } from "./mesures";

// TEMPORAIRE : diagnostic de la barre de navigation qui ne reste pas en bas.
// À supprimer une fois la cause trouvée.
export default async function Diagnostic() {
  await requireComite();
  return (
    <div className="space-y-4">
      <PageHeader back="/reglages" title="Diagnostic" />
      <Mesures />
    </div>
  );
}
