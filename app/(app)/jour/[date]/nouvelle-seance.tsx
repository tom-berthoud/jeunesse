"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { creerCategorieEtSeance, ouvrirSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { PALETTE, texteSur } from "@/lib/couleurs";
import { Alert, Button, Input } from "@/components/ui";
import { ChoixCouleur } from "@/components/choix-couleur";

type Categorie = { id: string; libelle: string; couleur: string };

export function NouvelleSeance({ date, categories }: { date: string; categories: Categorie[] }) {
  const [etat, ouvrir, ouverture] = useActionState(ouvrirSeance, ETAT_INITIAL);
  const [etatCat, creer, creation] = useActionState(creerCategorieEtSeance, ETAT_INITIAL);
  const [nouvelle, setNouvelle] = useState(categories.length === 0);
  const [couleur, setCouleur] = useState(PALETTE[0]);

  return (
    <div className="space-y-2">
      {categories.length > 0 && (
        <form action={ouvrir} className="grid grid-cols-2 gap-2">
          <input type="hidden" name="date" value={date} />
          {categories.map((c) => (
            <button
              key={c.id}
              name="categorie_id"
              value={c.id}
              disabled={ouverture}
              style={{ background: c.couleur, color: texteSur(c.couleur) }}
              className="flex min-h-16 items-center justify-center gap-2 rounded-xl px-3 text-base font-semibold transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={2.5} />
              {c.libelle}
            </button>
          ))}
        </form>
      )}
      {etat.erreur && <Alert>{etat.erreur}</Alert>}

      {nouvelle ? (
        <form action={creer} className="card space-y-3 p-4">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="couleur" value={couleur} />
          <Input name="libelle" placeholder="Nouvelle catégorie" required autoFocus={categories.length > 0} maxLength={40} />
          <ChoixCouleur valeur={couleur} onChange={setCouleur} />
          {etatCat.erreur && <Alert>{etatCat.erreur}</Alert>}
          <div className="flex gap-2">
            {categories.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setNouvelle(false)}>
                Annuler
              </Button>
            )}
            <Button disabled={creation} className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="ghost" className="w-full" onClick={() => setNouvelle(true)}>
          <Plus size={18} /> Autre catégorie
        </Button>
      )}
    </div>
  );
}
