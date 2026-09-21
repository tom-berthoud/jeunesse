"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { creerCategorieEtSeance, ouvrirSeance } from "@/app/(app)/seances/actions";
import { ETAT_INITIAL } from "@/lib/action";
import { PALETTE, texteSur } from "@/lib/couleurs";
import { Alert, Button, cn, Input } from "@/components/ui";

type Categorie = { id: string; libelle: string; couleur: string };

export function NouvelleSeance({ date, categories }: { date: string; categories: Categorie[] }) {
  const [etat, ouvrir, ouverture] = useActionState(ouvrirSeance, ETAT_INITIAL);
  const [etatCat, creer, creation] = useActionState(creerCategorieEtSeance, ETAT_INITIAL);
  const [nouvelle, setNouvelle] = useState(categories.length === 0);
  const [couleur, setCouleur] = useState(PALETTE[0]);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-ink-muted">Nouvelle séance</h2>

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
              className="min-h-14 rounded-xl px-3 text-base font-semibold shadow-sm transition-opacity active:opacity-80 disabled:opacity-50"
            >
              {c.libelle}
            </button>
          ))}
        </form>
      )}
      {etat.erreur && <Alert tone="danger">{etat.erreur}</Alert>}

      {nouvelle ? (
        <form action={creer} className="card space-y-3 p-4">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="couleur" value={couleur} />
          <p className="text-sm font-medium">Nouvelle catégorie</p>
          <Input name="libelle" placeholder="p. ex. Char, Costume, Loto…" required autoFocus={categories.length > 0} maxLength={40} />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
            {PALETTE.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={p === couleur}
                aria-label={p}
                onClick={() => setCouleur(p)}
                style={{ background: p }}
                className={cn("size-9 rounded-full", p === couleur && "ring-2 ring-ink ring-offset-2")}
              />
            ))}
          </div>
          {etatCat.erreur && <Alert tone="danger">{etatCat.erreur}</Alert>}
          <div className="flex gap-2">
            {categories.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setNouvelle(false)}>
                Annuler
              </Button>
            )}
            <Button disabled={creation} className="flex-1">
              {creation ? "Création…" : "Créer et ouvrir la séance"}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setNouvelle(true)}>
          <Plus size={18} /> Autre catégorie
        </Button>
      )}
    </section>
  );
}
