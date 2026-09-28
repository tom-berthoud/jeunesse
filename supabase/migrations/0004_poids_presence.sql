-- Poids par personne : une journée de char vaut 2, mais ceux qui ne viennent
-- que l'après-midi comptent 1.
--
-- `presences.poids` vide = poids de la séance. Le poids de la séance reste la
-- valeur de tout le monde ; la colonne ne sert qu'aux exceptions, et une
-- séance dont on change le poids entraîne tous ceux qui n'en ont pas d'autre.
--
-- Présent = une ligne, absent = pas de ligne, toujours. Le seul UPDATE permis
-- porte sur `poids` : supprimer puis réinsérer perdrait `added_by` / `added_at`.

alter table public.presences
  add column poids numeric(3, 1)
  check (poids is null or (poids > 0 and poids <= 5 and poids * 2 = floor(poids * 2)));

create policy "presences poids" on public.presences
  for update to authenticated
  using ((select public.is_comite())) with check ((select public.is_comite()));
grant update (poids) on public.presences to authenticated;

-- =============================================================
-- COMPTEUR — poids de la présence, sinon celui de la séance
-- =============================================================
-- Même signature : `create or replace` suffit.
--
-- Une présence hors période garde sa ligne `p` mais pas de `s` (le filtre est
-- dans la jointure) : sans le `case`, son poids personnel serait compté.

create or replace function public.compteur(
  p_debut date,
  p_fin date,
  p_categorie uuid default null
)
returns table (
  membre_id uuid,
  prenom text,
  nom text,
  statut public.statut_membre,
  archive boolean,
  presences numeric
)
language sql stable security invoker
set search_path = ''
as $$
  select m.id, m.prenom, m.nom, m.statut, m.archive,
         -- sum() vaut null quand le membre n'a aucune présence dans la période
         coalesce(sum(case when s.id is not null then coalesce(p.poids, s.poids) end), 0) as total
  from public.membres m
  left join public.presences p on p.membre_id = m.id
  left join public.seances s   on s.id = p.seance_id
                              and s.date between p_debut and p_fin
                              and (p_categorie is null or s.categorie_id = p_categorie)
  group by m.id
  order by total desc, m.nom, m.prenom;
$$;
