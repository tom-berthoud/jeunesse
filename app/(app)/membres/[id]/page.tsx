import Link from "next/link";
import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { dateCourte, dateNumerique } from "@/lib/dates";
import { Pencil } from "lucide-react";
import { IconLink, PageHeader, Pill, PoidsBadge, Section, StatutBadge } from "@/components/ui";
import { lireFiltres, requeteClassement, type ParamsClassement } from "../filtres-classement";

export default async function Membre({ params, searchParams }: PageProps<"/membres/[id]">) {
  const { id } = await params;
  const { supabase } = await requireComite();
  // Mêmes filtres que le classement d'où l'on vient (année en cours sinon),
  // pour que le total de la fiche soit celui de la ligne touchée.
  const sp = (await searchParams) as ParamsClassement;
  const { mode, periode, categorie } = lireFiltres(sp);
  const requete = requeteClassement(sp);

  const [{ data: membre }, { data: presences }] = await Promise.all([
    supabase.from("membres").select("id, prenom, nom, statut, archive").eq("id", id).maybeSingle(),
    supabase
      .from("presences")
      .select("poids, seance:seances(id, date, poids, categorie:categories(id, libelle, couleur))")
      .eq("membre_id", id),
  ]);
  if (!membre) notFound();

  // Poids de la personne s'il en a un, sinon celui de la séance, comme dans
  // compteur(). Totaux par catégorie : regroupement des lignes affichées
  // dessous, rien de recalculé ailleurs.
  const historique = (presences ?? [])
    .flatMap((p) => (p.seance ? [{ ...p.seance, poids: p.poids ?? p.seance.poids }] : []))
    .filter(
      (s) =>
        s.date >= periode.debut && s.date <= periode.fin && (!categorie || s.categorie?.id === categorie),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = historique.reduce((n, s) => n + s.poids, 0);

  const totaux = new Map<string, { libelle: string; couleur: string; n: number }>();
  for (const s of historique) {
    if (!s.categorie) continue;
    const t = totaux.get(s.categorie.id) ?? { libelle: s.categorie.libelle, couleur: s.categorie.couleur, n: 0 };
    t.n += s.poids;
    totaux.set(s.categorie.id, t);
  }

  const libellePeriode =
    mode === "tout" ? null
    : mode === "perso" ? `${dateNumerique(periode.debut)} – ${dateNumerique(periode.fin)}`
    : mode;

  // Regroupement par année pour la lecture
  const parAnnee = new Map<string, typeof historique>();
  for (const s of historique) {
    const a = s.date.slice(0, 4);
    parAnnee.set(a, [...(parAnnee.get(a) ?? []), s]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back={`/membres${requete && `?${requete}`}`}
        title={`${membre.prenom} ${membre.nom}`}
        actions={
          <>
            <StatutBadge statut={membre.statut} />
            <IconLink href={`/membres/${membre.id}/modifier`} aria-label="Modifier" className="-mr-2">
              <Pencil size={20} />
            </IconLink>
          </>
        }
      />

      <div className="card flex items-center justify-between px-4 py-3">
        <span className="text-3xl font-semibold tabular-nums">{total}</span>
        <span className="text-sm text-ink-muted">
          présence{total > 1 ? "s" : ""}
          {libellePeriode && ` · ${libellePeriode}`}
        </span>
      </div>

      {totaux.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...totaux.values()].map((t) => (
            <Pill key={t.libelle} color={t.couleur} className="px-2.5 py-1 text-sm">
              {t.libelle} · {t.n}
            </Pill>
          ))}
        </div>
      )}

      {historique.length > 0 && (
        <Section title="Historique">
          {[...parAnnee.entries()].map(([annee, seances]) => (
            <div key={annee} className="space-y-1.5">
              <p className="flex justify-between px-1 text-xs font-medium text-ink-faint">
                <span>{annee}</span>
                <span className="tabular-nums">{seances.reduce((n, s) => n + s.poids, 0)}</span>
              </p>
              <ul className="card divide-y divide-line">
                {seances.map((s) => (
                  <li key={s.id}>
                    <Link href={`/seances/${s.id}`} className="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                      <span className="w-24 shrink-0 text-sm text-ink-muted">{dateCourte(s.date)}</span>
                      <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                      <PoidsBadge poids={s.poids} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
