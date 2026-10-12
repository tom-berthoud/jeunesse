"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn, StatutBadge } from "@/components/ui";
import { normaliser } from "@/lib/texte";
import type { StatutMembre } from "@/lib/types/database";

type Ligne = { membre_id: string; prenom: string; nom: string; statut: StatutMembre; archive: boolean; presences: number };

/**
 * Classement avec recherche locale. Le rang reste celui du classement complet.
 * `requete` : filtres transmis à la fiche, pour qu'elle compte sur la même période.
 */
export function ListeClassement({ lignes, rangs, requete }: { lignes: Ligne[]; rangs: number[]; requete: string }) {
  const [recherche, setRecherche] = useState("");

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    return lignes
      .map((m, i) => ({ ...m, rang: rangs[i] }))
      .filter((m) => !q || normaliser(`${m.prenom} ${m.nom}`).includes(q) || normaliser(`${m.nom} ${m.prenom}`).includes(q));
  }, [lignes, rangs, recherche]);

  if (!lignes.length) return null;

  return (
    <>
      <label className="relative block">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher"
          aria-label="Rechercher"
          className="min-h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-10 text-base text-ink placeholder:text-ink-faint focus-brand"
        />
      </label>

      <ol className="card divide-y divide-line overflow-hidden">
        {visibles.map((m) => (
          <li key={m.membre_id}>
            <Link href={`/membres/${m.membre_id}${requete && `?${requete}`}`} className="flex min-h-13 items-center gap-3 px-4 py-2 hover:bg-surface-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                  m.rang <= 3 && m.presences > 0 ? "bg-accent text-on-accent" : "text-ink-faint",
                )}
              >
                {m.rang}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", m.archive && "text-ink-faint")}>
                {m.prenom} {m.nom}
              </span>
              <StatutBadge statut={m.statut} />
              <span className="w-12 shrink-0 text-right text-lg font-semibold tabular-nums">{m.presences}</span>
            </Link>
          </li>
        ))}
        {!visibles.length && <li className="px-4 py-8 text-center text-sm text-ink-faint">—</li>}
      </ol>
    </>
  );
}
