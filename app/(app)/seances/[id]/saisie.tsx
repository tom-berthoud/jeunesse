"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, Search } from "lucide-react";
import { basculerPresence } from "@/app/(app)/seances/actions";
import { Alert, cn, StatutBadge } from "@/components/ui";
import type { StatutMembre } from "@/lib/types/database";

type Membre = { id: string; prenom: string; nom: string; statut: StatutMembre; archive: boolean };
type Filtre = "tous" | "presents" | "absents";

/** Recherche insensible à la casse et aux accents (« zoe » trouve « Zoé »). */
const normaliser = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

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
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-surface-2/95 px-4 pt-1 pb-2 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold tabular-nums">
            {set.size} <span className="text-base font-normal text-ink-muted">présent{set.size > 1 ? "s" : ""}</span>
          </p>
          <p className="text-sm text-ink-faint">sur {membres.length}</p>
        </div>
        <label className="relative block">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher"
            className="min-h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-10 text-base focus-brand"
          />
        </label>
        <div className="flex gap-1.5">
          {(
            [
              ["tous", "Tous"],
              ["presents", "Présents"],
              ["absents", "Absents"],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFiltre(v)}
              className={cn(
                "min-h-9 rounded-full px-3.5 text-sm font-medium",
                filtre === v ? "bg-brand text-white" : "bg-surface text-ink-muted ring-1 ring-line",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {erreur && <Alert tone="danger">{erreur}</Alert>}

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
                  on ? "bg-brand-50" : "active:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                    on ? "border-brand bg-brand text-white" : "border-line",
                  )}
                >
                  {on && <Check size={16} strokeWidth={3} />}
                </span>
                <span className={cn("flex-1 text-base", on && "font-medium")}>
                  {m.prenom} {m.nom}
                </span>
                <StatutBadge statut={m.statut} />
                {m.archive && <span className="text-[11px] text-ink-faint">archivé</span>}
              </button>
            </li>
          );
        })}
        {!visibles.length && <li className="px-4 py-8 text-center text-sm text-ink-muted">Personne.</li>}
      </ul>
    </div>
  );
}
