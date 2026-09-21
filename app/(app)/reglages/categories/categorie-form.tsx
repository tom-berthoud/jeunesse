"use client";

import { useActionState, useState } from "react";
import { creerCategorie, modifierCategorie, supprimerCategorie } from "./actions";
import { ETAT_INITIAL } from "@/lib/action";
import { PALETTE } from "@/lib/couleurs";
import { Alert, Button, cn, Input, Pill, Repli } from "@/components/ui";
import { ChoixCouleur } from "@/components/choix-couleur";

type Categorie = { id: string; libelle: string; couleur: string; archivee: boolean };

export function CategorieForm({ categorie, nbSeances, admin }: { categorie: Categorie; nbSeances: number; admin: boolean }) {
  const [etat, action, pending] = useActionState(modifierCategorie, ETAT_INITIAL);
  const [etatSup, supprimer, suppression] = useActionState(supprimerCategorie, ETAT_INITIAL);
  const [couleur, setCouleur] = useState(categorie.couleur);

  return (
    <Repli
      className={cn(categorie.archivee && "opacity-60")}
      entete={
        <>
          <Pill color={categorie.couleur}>{categorie.libelle}</Pill>
          <span className="text-sm tabular-nums text-ink-faint">{nbSeances}</span>
        </>
      }
    >
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={categorie.id} />
        <input type="hidden" name="couleur" value={couleur} />
        <Input name="libelle" defaultValue={categorie.libelle} required maxLength={40} aria-label="Nom" />
        <ChoixCouleur valeur={couleur} onChange={setCouleur} />
        <label className="flex min-h-11 items-center gap-3 px-1 text-sm">
          <input type="checkbox" name="archivee" defaultChecked={categorie.archivee} className="size-5 accent-primary" />
          Archivée
        </label>
        {etat.erreur && <Alert>{etat.erreur}</Alert>}
        {etat.ok && <Alert tone="success">{etat.ok}</Alert>}
        <Button disabled={pending} className="w-full">Enregistrer</Button>
      </form>
      {admin && nbSeances === 0 && (
        <form
          action={supprimer}
          onSubmit={(e) => {
            if (!confirm(`Supprimer « ${categorie.libelle} » ?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={categorie.id} />
          {etatSup.erreur && <Alert>{etatSup.erreur}</Alert>}
          <Button variant="danger" disabled={suppression} className="w-full">Supprimer</Button>
        </form>
      )}
    </Repli>
  );
}

export function NouvelleCategorie() {
  const [etat, action, pending] = useActionState(creerCategorie, ETAT_INITIAL);
  const [couleur, setCouleur] = useState(PALETTE[0]);

  return (
    <form action={action} key={etat.ok} className="card space-y-3 p-4">
      <input type="hidden" name="couleur" value={couleur} />
      <Input name="libelle" placeholder="Nouvelle catégorie" aria-label="Nouvelle catégorie" required maxLength={40} />
      <ChoixCouleur valeur={couleur} onChange={setCouleur} />
      {etat.erreur && <Alert>{etat.erreur}</Alert>}
      <Button disabled={pending} className="w-full">Créer</Button>
    </form>
  );
}
