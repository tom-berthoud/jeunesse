import { Download, UserPlus } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { IconLink, Input, PageHeader, Select } from "@/components/ui";
import { Filtres } from "./filtres";
import { lireFiltres, rangs, type ParamsClassement } from "./filtres-classement";
import { ListeClassement } from "./liste-classement";

export default async function Membres({ searchParams }: PageProps<"/membres">) {
  const { supabase } = await requireComite();
  const sp = (await searchParams) as ParamsClassement;
  const { anneeCourante, mode, debut, fin, periode, statut, archives, ...f } = lireFiltres(sp);

  const [{ data: categories }, { data: premiere }] = await Promise.all([
    // Les ponctuelles (archivées) après les permanentes.
    supabase.from("categories").select("id, libelle").order("archivee").order("ordre").order("libelle"),
    supabase.from("seances").select("date").order("date").limit(1).maybeSingle(),
  ]);
  const categorie = categories?.some((c) => c.id === f.categorie) ? f.categorie : "";

  const { data: compteur, error } = await supabase.rpc("compteur", {
    p_debut: periode.debut,
    p_fin: periode.fin,
    p_categorie: categorie || null,
  });
  if (error) throw new Error(error.message);

  const lignes = (compteur ?? []).filter((m) => (archives || !m.archive) && (!statut || m.statut === statut));

  const premiereAnnee = premiere ? Number(premiere.date.slice(0, 4)) : anneeCourante;
  const annees = [];
  for (let a = Math.max(anneeCourante, premiereAnnee); a >= Math.min(anneeCourante, premiereAnnee); a--) annees.push(a);

  const exportParams = new URLSearchParams(
    Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string"),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Membres"
        actions={
          <>
            {/* Mêmes filtres que l'écran. `download` : Link laisse le navigateur télécharger. */}
            <IconLink href={`/membres/export?${exportParams}`} download prefetch={false} aria-label="Exporter en CSV">
              <Download size={22} />
            </IconLink>
            <IconLink href="/membres/nouveau" aria-label="Ajouter des membres">
              <UserPlus size={22} />
            </IconLink>
          </>
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

      <ListeClassement lignes={lignes} rangs={rangs(lignes)} />
    </div>
  );
}
