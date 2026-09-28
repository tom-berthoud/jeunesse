"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { basculerPresence } from "@/app/(app)/seances/actions";
import { Alert, cn, StatutBadge } from "@/components/ui";
import { normaliser } from "@/lib/texte";
import type { StatutMembre } from "@/lib/types/database";

type Membre = { id: string; prenom: string; nom: string; statut: StatutMembre; archive: boolean };
type Filtre = "tous" | "presents" | "absents";

const FILTRES = [
  ["tous", "Tous"],
  ["presents", "Présents"],
  ["absents", "Absents"],
] as const;

export function Saisie({ seanceId, membres, presents }: { seanceId: string; membres: Membre[]; presents: string[] }) {
  // Affiche l'état voulu immédiatement ; revient à l'état serveur à la fin de
  // la transition. En cas d'échec, la case retombe donc d'elle-même.
  const [optimistes, appliquer] = useOptimistic(presents, (etat: string[], a: { id: string; present: boolean }) =>
    a.present ? [...etat, a.id] : etat.filter((x) => x !== a.id),
  );
  const [, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tous");

  const set = useMemo(() => new Set(optimistes), [optimistes]);

  const visibles = useMemo(() => {
    const q = normaliser(recherche.trim());
    return membres.filter((m) => {
      if (filtre === "presents" && !set.has(m.id)) return false;
      if (filtre === "absents" && set.has(m.id)) return false;
      return !q || normaliser(`${m.prenom} ${m.nom}`).includes(q) || normaliser(`${m.nom} ${m.prenom}`).includes(q);
    });
  }, [membres, recherche, filtre, set]);

  function basculer(id: string) {
    const present = !set.has(id);
    setErreur(null);
    startTransition(async () => {
      appliquer({ id, present });
      const r = await basculerPresence(seanceId, id, present);
      if (r.erreur) setErreur(r.erreur);
    });
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-page/95 px-4 pt-2 pb-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
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
          <span
            aria-label={`${set.size} présents sur ${membres.length}`}
            className="grid min-h-11 min-w-16 place-items-center rounded-lg bg-accent px-3 text-lg font-semibold tabular-nums text-on-accent"
          >
            {set.size}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {FILTRES.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltre(v)}
              aria-pressed={filtre === v}
              className={cn(
                "min-h-9 rounded-lg text-sm font-medium transition-colors",
                filtre === v ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {erreur && <Alert>{erreur}</Alert>}

      <ul className="card divide-y divide-line overflow-hidden">
        {visibles.map((m) => {
          const on = set.has(m.id);
          return (
            <li key={m.id}>
              <button
                onClick={() => basculer(m.id)}
                aria-pressed={on}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors",
                  on ? "bg-accent-soft" : "active:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    on ? "border-accent bg-accent text-on-accent" : "border-line",
                  )}
                >
                  {on && <Check size={16} strokeWidth={3} />}
                </span>
                <span className={cn("flex-1 text-base", on && "font-medium", m.archive && "text-ink-muted")}>
                  {m.prenom} {m.nom}
                </span>
                <StatutBadge statut={m.statut} />
              </button>
            </li>
          );
        })}
        {!visibles.length && <li className="px-4 py-8 text-center text-sm text-ink-faint">—</li>}
      </ul>
    </div>
  );
}
