"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { creerCategorieEtSeance, ouvrirSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { PALETTE, texteSur } from "@/lib/couleurs";
import { OPTIONS_POIDS, POIDS_DEFAUT, type Poids } from "@/lib/poids";
import { Alert, Button, Input, Segments } from "@/components/ui";
import { ChoixCouleur } from "@/components/choix-couleur";

type Categorie = { id: string; libelle: string; couleur: string };

export function NouvelleSeance({
  date,
  categories,
  ponctuelles,
}: {
  date: string;
  categories: Categorie[];
  ponctuelles: string[];
}) {
  const [etat, ouvrir, ouverture] = useActionState(ouvrirSeance, ETAT_INITIAL);
  const [etatCat, creer, creation] = useActionState(creerCategorieEtSeance, ETAT_INITIAL);
  const [nouvelle, setNouvelle] = useState(categories.length === 0);
  const [couleur, setCouleur] = useState(PALETTE[0]);
  // Choisi avant d'ouvrir la séance : taper une catégorie la crée aussitôt.
  const [poids, setPoids] = useState<Poids>(POIDS_DEFAUT);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="px-1 text-xs font-medium text-ink-muted">Compte pour</p>
        <Segments name="poids" options={OPTIONS_POIDS} valeur={poids} onChange={setPoids} />
      </div>

      {categories.length > 0 && (
        <form action={ouvrir} className="grid grid-cols-2 gap-2">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="poids" value={poids} />
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
          <input type="hidden" name="poids" value={poids} />
          <Input
            name="libelle"
            placeholder="Nouvelle catégorie"
            list="ponctuelles"
            autoComplete="off"
            required
            autoFocus={categories.length > 0}
            maxLength={40}
          />
          <datalist id="ponctuelles">
            {ponctuelles.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
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
