import Link from "next/link";
import { notFound } from "next/navigation";
import { requireComite } from "@/lib/auth";
import { dateCourte } from "@/lib/dates";
import { PageHeader, Pill, Section, StatutBadge } from "@/components/ui";
import { MembreForm } from "../membre-form";
import { SupprimerMembre } from "./supprimer";

export default async function Membre({ params }: PageProps<"/membres/[id]">) {
  const { id } = await params;
  const { supabase, profile } = await requireComite();

  const [{ data: membre }, { data: presences }] = await Promise.all([
    supabase.from("membres").select("id, prenom, nom, statut, archive").eq("id", id).maybeSingle(),
    supabase
      .from("presences")
      .select("seance:seances(id, date, categorie:categories(id, libelle, couleur))")
      .eq("membre_id", id),
  ]);
  if (!membre) notFound();

  const historique = (presences ?? [])
    .map((p) => p.seance)
    .filter((s) => s !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Totaux par catégorie : simple regroupement des lignes affichées dessous.
  const totaux = new Map<string, { libelle: string; couleur: string; n: number }>();
  for (const s of historique) {
    if (!s.categorie) continue;
    const t = totaux.get(s.categorie.id) ?? { libelle: s.categorie.libelle, couleur: s.categorie.couleur, n: 0 };
    t.n++;
    totaux.set(s.categorie.id, t);
  }

  // Regroupement par année pour la lecture
  const parAnnee = new Map<string, typeof historique>();
  for (const s of historique) {
    const a = s.date.slice(0, 4);
    parAnnee.set(a, [...(parAnnee.get(a) ?? []), s]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back="/membres"
        title={`${membre.prenom} ${membre.nom}`}
        actions={<StatutBadge statut={membre.statut} />}
      />

      <div className="card flex items-center justify-between px-4 py-3">
        <span className="text-3xl font-semibold tabular-nums">{historique.length}</span>
        <span className="text-sm text-ink-muted">présence{historique.length > 1 ? "s" : ""}</span>
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
                <span className="tabular-nums">{seances.length}</span>
              </p>
              <ul className="card divide-y divide-line">
                {seances.map((s) => (
                  <li key={s.id}>
                    <Link href={`/seances/${s.id}`} className="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                      <span className="w-24 shrink-0 text-sm text-ink-muted">{dateCourte(s.date)}</span>
                      <Pill color={s.categorie?.couleur ?? "#6b7280"}>{s.categorie?.libelle}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      <Section title="Modifier">
        <MembreForm membre={membre} />
        {profile.role === "admin" && historique.length === 0 && <SupprimerMembre id={membre.id} />}
      </Section>
    </div>
  );
}
