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
import { cn, Empty, Pill } from "@/components/ui";

const JOURS = ["lu", "ma", "me", "je", "ve", "sa", "di"];

export default async function Calendrier({ searchParams }: PageProps<"/">) {
  const { supabase } = await requireComite();
  const { mois: moisParam } = await searchParams;
  const today = aujourdhui();
  const mois = parseMois(moisParam) ?? moisDe(today);

  const { data: seances } = await supabase
    .from("seances")
    .select("id, date, categorie:categories(libelle, couleur), presences(count)")
    .gte("date", premierJour(mois))
    .lte("date", dernierJour(mois))
    .order("date");

  const parJour = new Map<string, NonNullable<typeof seances>>();
  for (const s of seances ?? []) parJour.set(s.date, [...(parJour.get(s.date) ?? []), s]);

  const estMoisCourant = formatMoisParam(mois) === formatMoisParam(moisDe(today));
  const lien = (delta: number) => `/?mois=${formatMoisParam(decalerMois(mois, delta))}`;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-1">
        <h1 className="flex-1 text-xl font-semibold capitalize tracking-tight">{nomMois(mois)}</h1>
        {!estMoisCourant && (
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-surface">
            Aujourd&apos;hui
          </Link>
        )}
        <Link href={lien(-1)} aria-label="Mois précédent" className="grid size-11 place-items-center rounded-lg hover:bg-surface">
          <ChevronLeft size={22} />
        </Link>
        <Link href={lien(1)} aria-label="Mois suivant" className="grid size-11 place-items-center rounded-lg hover:bg-surface">
          <ChevronRight size={22} />
        </Link>
      </header>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-[11px] font-medium uppercase text-ink-faint">
          {JOURS.map((j) => (
            <div key={j} className="py-1.5">{j}</div>
          ))}
        </div>
        {grilleMois(mois).map((semaine, i) => (
          <div key={i} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {semaine.map((jour, k) =>
              jour ? (
                <Link
                  key={jour}
                  href={`/jour/${jour}`}
                  className={cn(
                    "flex aspect-square flex-col items-center gap-1 border-r border-line pt-1.5 last:border-r-0 hover:bg-brand-50",
                    k >= 5 && "bg-surface-2/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-sm",
                      jour === today ? "bg-brand font-semibold text-white" : "text-ink",
                    )}
                  >
                    {jourDuMois(jour)}
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5 px-0.5">
                    {parJour.get(jour)?.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className="size-2 rounded-full"
                        style={{ background: s.categorie?.couleur }}
                        title={s.categorie?.libelle}
                      />
                    ))}
                  </span>
                </Link>
              ) : (
                <div key={`vide-${k}`} className="border-r border-line bg-surface-2/40 last:border-r-0" />
              ),
            )}
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-ink-muted">Séances du mois</h2>
        {seances?.length ? (
          <ul className="card divide-y divide-line">
            {seances.map((s) => (
              <li key={s.id}>
                <Link href={`/seances/${s.id}`} className="flex min-h-12 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                  <span className="w-24 shrink-0 text-sm capitalize text-ink-muted">{dateCourte(s.date)}</span>
                  <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                  <span className="ml-auto text-sm tabular-nums text-ink-muted">
                    {s.presences[0]?.count ?? 0} présent{(s.presences[0]?.count ?? 0) > 1 ? "s" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune séance ce mois. Touche un jour pour en créer une.</Empty>
        )}
      </section>

      <Link
        href={`/jour/${today}`}
        aria-label="Nouvelle séance aujourd'hui"
        className="fixed right-4 bottom-24 z-20 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg active:bg-brand-700"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}
