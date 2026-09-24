-- Poids d'une séance : combien de présences elle vaut.
--
-- Une soirée de montage compte 1, une journée complète 2, une demi-journée 0.5.
-- Le poids est porté par la SÉANCE, pas par la présence : tout le monde y fait
-- la même journée. S'il faut un jour distinguer personne par personne, la
-- colonne se déplacera sur `presences` sans changer le reste.
--
-- Multiples de 0,5 jusqu'à 5. L'interface n'en propose que trois (0.5, 1, 2,
-- dans `lib/poids.ts`) ; la borne laisse la place à un autre barème sans
-- migration, sans permettre une valeur aberrante.

alter table public.seances
  add column poids numeric(3, 1) not null default 1
  check (poids > 0 and poids <= 5 and poids * 2 = floor(poids * 2));

-- Le code n'écrit que la remarque et le poids. Sans cette restriction, un
-- membre du comité pouvait déplacer une séance ou s'en attribuer la paternité
-- (`created_by`), donc le droit de la supprimer.
revoke update on public.seances from authenticated;
grant update (remarque, poids) on public.seances to authenticated;

-- =============================================================
-- COMPTEUR — somme des poids au lieu du nombre de lignes
-- =============================================================
-- Le type de retour change : il faut supprimer puis recréer.

drop function public.compteur(date, date, uuid);

create function public.compteur(
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
         coalesce(sum(s.poids), 0)
  from public.membres m
  left join public.presences p on p.membre_id = m.id
  left join public.seances s   on s.id = p.seance_id
                              and s.date between p_debut and p_fin
                              and (p_categorie is null or s.categorie_id = p_categorie)
  group by m.id
  order by coalesce(sum(s.poids), 0) desc, m.nom, m.prenom;
$$;

revoke execute on function public.compteur(date, date, uuid) from public, anon;
grant execute on function public.compteur(date, date, uuid) to authenticated;
