"use client";

import { Button } from "@/components/ui";

export default function Erreur({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card space-y-3 px-4 py-8 text-center">
      <p className="font-medium">Quelque chose n&apos;a pas fonctionné.</p>
      <p className="text-sm text-ink-muted">Vérifie ta connexion puis réessaie.</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
