import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { dateLongue, decalerJour, estDate, formatMoisParam, moisDe } from "@/lib/dates";
import { PageHeader, Pill } from "@/components/ui";
import { NouvelleSeance } from "./nouvelle-seance";

export default async function Jour({ params }: PageProps<"/jour/[date]">) {
  const { date } = await params;
  if (!estDate(date)) notFound();
  const { supabase } = await requireComite();

  const [{ data: seances }, { data: categories }] = await Promise.all([
    supabase
      .from("seances")
      .select("id, categorie_id, remarque, categorie:categories(libelle, couleur), presences(count)")
      .eq("date", date),
    supabase.from("categories").select("id, libelle, couleur").eq("archivee", false).order("ordre").order("libelle"),
  ]);

  const dejaOuvertes = new Set(seances?.map((s) => s.categorie_id));
  const disponibles = (categories ?? []).filter((c) => !dejaOuvertes.has(c.id));

  return (
    <div className="space-y-5">
      <PageHeader
        back={`/?mois=${formatMoisParam(moisDe(date))}`}
        title={<span className="capitalize">{dateLongue(date)}</span>}
        actions={
          <>
            <Link href={`/jour/${decalerJour(date, -1)}`} aria-label="Jour précédent" className="grid size-11 place-items-center rounded-lg hover:bg-surface">
              <ChevronLeft size={22} />
            </Link>
            <Link href={`/jour/${decalerJour(date, 1)}`} aria-label="Jour suivant" className="grid size-11 place-items-center rounded-lg hover:bg-surface">
              <ChevronRight size={22} />
            </Link>
          </>
        }
      />

      {!!seances?.length && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-ink-muted">Séances de ce jour</h2>
          <ul className="card divide-y divide-line">
            {seances.map((s) => {
              const n = s.presences[0]?.count ?? 0;
              return (
                <li key={s.id}>
                  <Link href={`/seances/${s.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                    <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                    {s.remarque && <span className="truncate text-sm text-ink-muted">{s.remarque}</span>}
                    <span className="ml-auto shrink-0 text-sm tabular-nums text-ink-muted">
                      {n} présent{n > 1 ? "s" : ""}
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-ink-faint" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <NouvelleSeance date={date} categories={disponibles} />
    </div>
  );
}
