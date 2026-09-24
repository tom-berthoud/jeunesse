import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { requireComite } from "@/lib/auth";
import {
  aujourdhui,
  dateCourte,
  decalerMois,
  dernierJour,
  formatMoisParam,
  grilleMois,
  jourDuMois,
  moisDe,
  nomMois,
  parseMois,
  premierJour,
} from "@/lib/dates";
import { cn, IconLink, Pill, PoidsBadge } from "@/components/ui";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

export default async function Calendrier({ searchParams }: PageProps<"/">) {
  const { supabase } = await requireComite();
  const { mois: moisParam } = await searchParams;
  const today = aujourdhui();
  const mois = parseMois(moisParam) ?? moisDe(today);

  const { data: seances } = await supabase
    .from("seances")
    .select("id, date, poids, categorie:categories(libelle, couleur), presences(count)")
    .gte("date", premierJour(mois))
    .lte("date", dernierJour(mois))
    .order("date");

  const parJour = new Map<string, NonNullable<typeof seances>>();
  for (const s of seances ?? []) parJour.set(s.date, [...(parJour.get(s.date) ?? []), s]);

  const estMoisCourant = formatMoisParam(mois) === formatMoisParam(moisDe(today));
  const lien = (delta: number) => `/?mois=${formatMoisParam(decalerMois(mois, delta))}`;

  return (
    <div className="space-y-5">
      <header className="flex min-h-11 items-center gap-1">
        <h1 className="flex-1 text-xl font-semibold tracking-tight">{nomMois(mois)}</h1>
        {!estMoisCourant && (
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink">
            Aujourd&apos;hui
          </Link>
        )}
        <IconLink href={lien(-1)} aria-label="Mois précédent">
          <ChevronLeft size={22} />
        </IconLink>
        <IconLink href={lien(1)} aria-label="Mois suivant">
          <ChevronRight size={22} />
        </IconLink>
      </header>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-medium text-ink-faint">
          {JOURS.map((j, i) => (
            <div key={i} className="py-2">{j}</div>
          ))}
        </div>
        {grilleMois(mois).map((semaine, i) => (
          <div key={i} className="grid grid-cols-7">
            {semaine.map((jour, k) =>
              jour ? (
                <Link
                  key={jour}
                  href={`/jour/${jour}`}
                  className="flex aspect-square flex-col items-center gap-1 pt-1.5 transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-sm tabular-nums",
                      jour === today ? "bg-accent font-semibold text-on-accent" : k >= 5 ? "text-ink-muted" : "text-ink",
                    )}
                  >
                    {jourDuMois(jour)}
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5 px-0.5">
                    {parJour.get(jour)?.slice(0, 4).map((s) => (
                      <span key={s.id} className="size-1.5 rounded-full" style={{ background: s.categorie?.couleur }} />
                    ))}
                  </span>
                </Link>
              ) : (
                <div key={`vide-${k}`} />
              ),
            )}
          </div>
        ))}
      </div>

      {!!seances?.length && (
        <ul className="card divide-y divide-line overflow-hidden">
          {seances.map((s) => {
            const n = s.presences[0]?.count ?? 0;
            return (
              <li key={s.id}>
                <Link href={`/seances/${s.id}`} className="flex min-h-13 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                  <span className="w-24 shrink-0 text-sm text-ink-muted">{dateCourte(s.date)}</span>
                  <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                  <span className="ml-auto flex items-center gap-2">
                    <PoidsBadge poids={s.poids} />
                    <span className="text-sm font-medium tabular-nums">{n}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={`/jour/${today}`}
        aria-label="Nouvelle séance"
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-full bg-accent text-on-accent shadow-lg shadow-black/20 transition-transform active:scale-95"
      >
        <Plus size={26} strokeWidth={2.25} />
      </Link>
    </div>
  );
}
