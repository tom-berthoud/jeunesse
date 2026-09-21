import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { dateLongue, decalerJour, estDate, formatMoisParam, moisDe } from "@/lib/dates";
import { IconLink, PageHeader, Pill } from "@/components/ui";
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
    <div className="space-y-4">
      <PageHeader
        back={`/?mois=${formatMoisParam(moisDe(date))}`}
        title={dateLongue(date)}
        actions={
          <>
            <IconLink href={`/jour/${decalerJour(date, -1)}`} aria-label="Jour précédent">
              <ChevronLeft size={22} />
            </IconLink>
            <IconLink href={`/jour/${decalerJour(date, 1)}`} aria-label="Jour suivant">
              <ChevronRight size={22} />
            </IconLink>
          </>
        }
      />

      {!!seances?.length && (
        <ul className="card divide-y divide-line overflow-hidden">
          {seances.map((s) => (
            <li key={s.id}>
              <Link href={`/seances/${s.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                {s.remarque && <span className="truncate text-sm text-ink-muted">{s.remarque}</span>}
                <span className="ml-auto shrink-0 text-sm font-medium tabular-nums">{s.presences[0]?.count ?? 0}</span>
                <ChevronRight size={18} className="shrink-0 text-ink-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NouvelleSeance date={date} categories={disponibles} />
    </div>
  );
}
