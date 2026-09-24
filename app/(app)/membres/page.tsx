import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { aujourdhui, estDate } from "@/lib/dates";
import { cn, IconLink, Input, PageHeader, Select, StatutBadge } from "@/components/ui";
import { Filtres } from "./filtres";

type Params = { annee?: string; debut?: string; fin?: string; categorie?: string; statut?: string; archives?: string };

export default async function Membres({ searchParams }: PageProps<"/membres">) {
  const { supabase } = await requireComite();
  const sp = (await searchParams) as Params;

  const anneeCourante = Number(aujourdhui().slice(0, 4));

  // Période : une année civile, tout, ou deux dates libres. Les bornes
  // personnalisées restent dans l'URL même quand une année est choisie, pour
  // les retrouver en revenant sur « Dates ».
  const mode =
    sp.annee === "tout" || sp.annee === "perso" ? sp.annee
    : /^\d{4}$/.test(sp.annee ?? "") ? sp.annee!
    : String(anneeCourante);
  const debut = estDate(sp.debut) ? sp.debut : `${anneeCourante}-01-01`;
  const fin = estDate(sp.fin) ? sp.fin : aujourdhui();
  const periode =
    mode === "tout" ? { debut: "1900-01-01", fin: "2999-12-31" }
    : mode === "perso" ? (debut <= fin ? { debut, fin } : { debut: fin, fin: debut })
    : { debut: `${mode}-01-01`, fin: `${mode}-12-31` };

  const statut = sp.statut === "actif" || sp.statut === "passif" ? sp.statut : "";
  const archives = sp.archives === "1";

  const [{ data: categories }, { data: premiere }] = await Promise.all([
    supabase.from("categories").select("id, libelle").order("ordre").order("libelle"),
    supabase.from("seances").select("date").order("date").limit(1).maybeSingle(),
  ]);
  const categorie = categories?.some((c) => c.id === sp.categorie) ? sp.categorie! : "";

  const { data: compteur, error } = await supabase.rpc("compteur", {
    p_debut: periode.debut,
    p_fin: periode.fin,
    p_categorie: categorie || null,
  });
  if (error) throw new Error(error.message);

  const lignes = (compteur ?? []).filter((m) => (archives || !m.archive) && (!statut || m.statut === statut));

  // Rang « sportif » : ex æquo au même rang, le suivant saute (1, 2, 2, 4).
  const rangs = lignes.map((m) => lignes.findIndex((x) => x.presences === m.presences) + 1);

  const premiereAnnee = premiere ? Number(premiere.date.slice(0, 4)) : anneeCourante;
  const annees = [];
  for (let a = Math.max(anneeCourante, premiereAnnee); a >= Math.min(anneeCourante, premiereAnnee); a--) annees.push(a);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Membres"
        actions={
          <IconLink href="/membres/nouveau" aria-label="Ajouter des membres">
            <UserPlus size={22} />
          </IconLink>
        }
      />

      <Filtres>
        <Select name="annee" defaultValue={mode} aria-label="Période">
          {annees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value="tout">Tout</option>
          <option value="perso">Dates</option>
        </Select>
        <Select name="categorie" defaultValue={categorie} aria-label="Catégorie">
          <option value="">Toutes</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.libelle}</option>
          ))}
        </Select>
        <Select name="statut" defaultValue={statut} aria-label="Statut">
          <option value="">Actifs et passifs</option>
          <option value="actif">Actifs</option>
          <option value="passif">Passifs</option>
        </Select>
        {mode === "perso" && (
          <div className="col-span-3 flex items-center gap-2">
            <Input type="date" name="debut" defaultValue={debut} aria-label="Début de la période" />
            <Input type="date" name="fin" defaultValue={fin} aria-label="Fin de la période" />
          </div>
        )}
        <label className="col-span-3 flex min-h-9 items-center gap-2 px-1 text-sm text-ink-muted">
          <input type="checkbox" name="archives" value="1" defaultChecked={archives} className="size-4 accent-primary" />
          Anciens membres
        </label>
      </Filtres>

      {lignes.length ? (
        <ol className="card divide-y divide-line overflow-hidden">
          {lignes.map((m, i) => (
            <li key={m.membre_id}>
              <Link href={`/membres/${m.membre_id}`} className="flex min-h-13 items-center gap-3 px-4 py-2 hover:bg-surface-2">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                    rangs[i] <= 3 && m.presences > 0 ? "bg-accent text-on-accent" : "text-ink-faint",
                  )}
                >
                  {rangs[i]}
                </span>
                <span className={cn("min-w-0 flex-1 truncate", m.archive && "text-ink-faint")}>
                  {m.prenom} {m.nom}
                </span>
                <StatutBadge statut={m.statut} />
                <span className="w-12 shrink-0 text-right text-lg font-semibold tabular-nums">{m.presences}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
