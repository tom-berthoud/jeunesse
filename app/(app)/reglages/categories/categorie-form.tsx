"use client";

import { useActionState, useState } from "react";
import { creerCategorie, modifierCategorie, supprimerCategorie } from "./actions";
import { ETAT_INITIAL } from "@/lib/action";
import { PALETTE } from "@/lib/couleurs";
import { Alert, Button, cn, Input, Pill } from "@/components/ui";

function Couleurs({ valeur, onChange }: { valeur: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
      {PALETTE.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={p === valeur}
          aria-label={p}
          onClick={() => onChange(p)}
          style={{ background: p }}
          className={cn("size-9 rounded-full", p === valeur && "ring-2 ring-ink ring-offset-2")}
        />
      ))}
    </div>
  );
}

type Categorie = { id: string; libelle: string; couleur: string; archivee: boolean };

export function CategorieForm({ categorie, nbSeances, admin }: { categorie: Categorie; nbSeances: number; admin: boolean }) {
  const [etat, action, pending] = useActionState(modifierCategorie, ETAT_INITIAL);
  const [etatSup, supprimer, suppression] = useActionState(supprimerCategorie, ETAT_INITIAL);
  const [couleur, setCouleur] = useState(categorie.couleur);

  return (
    <details className={cn("card", categorie.archivee && "opacity-60")}>
      <summary className="flex min-h-13 cursor-pointer items-center gap-3 px-4">
        <Pill color={categorie.couleur}>{categorie.libelle}</Pill>
        {categorie.archivee && <span className="text-xs text-ink-faint">archivée</span>}
        <span className="ml-auto text-sm text-ink-muted">
          {nbSeances} séance{nbSeances > 1 ? "s" : ""}
        </span>
      </summary>
      <div className="space-y-3 border-t border-line p-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={categorie.id} />
          <input type="hidden" name="couleur" value={couleur} />
          <Input name="libelle" defaultValue={categorie.libelle} required maxLength={40} aria-label="Nom" />
          <Couleurs valeur={couleur} onChange={setCouleur} />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="archivee" defaultChecked={categorie.archivee} className="size-5 accent-brand" />
            Archivée
          </label>
          {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
          {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
          <Button variant="outline" disabled={pending} className="w-full">Enregistrer</Button>
        </form>
        {admin && nbSeances === 0 && (
          <form
            action={supprimer}
            onSubmit={(e) => {
              if (!confirm(`Supprimer « ${categorie.libelle} » ?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={categorie.id} />
            {etatSup.erreur && <Alert tone="danger">{etatSup.erreur}</Alert>}
            <Button variant="danger" disabled={suppression} className="w-full">Supprimer</Button>
          </form>
        )}
      </div>
    </details>
  );
}

export function NouvelleCategorie() {
  const [etat, action, pending] = useActionState(creerCategorie, ETAT_INITIAL);
  const [couleur, setCouleur] = useState(PALETTE[0]);

  return (
    <form action={action} key={etat.ok} className="card space-y-3 p-4">
      <p className="text-sm font-medium">Nouvelle catégorie</p>
      <input type="hidden" name="couleur" value={couleur} />
      <Input name="libelle" placeholder="p. ex. Loto, Soirée…" required maxLength={40} />
      <Couleurs valeur={couleur} onChange={setCouleur} />
      {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}
      {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
      <Button disabled={pending} className="w-full">Créer</Button>
    </form>
  );
}
