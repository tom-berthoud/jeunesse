-- Données de démonstration pour les captures du guide (membres fictifs).
update public.profiles set role = 'admin', doit_changer_mdp = false where nom = 'Tom Admin';
update public.profiles set doit_changer_mdp = false where nom = 'Julie';

insert into public.categories (libelle, couleur, ordre, archivee) values
  ('Rangement fête', '#0f8a6a', 0, true);

insert into public.membres (prenom, nom, statut, archive) values ('Yann', 'Borcard', 'actif', true);

do $$
declare
  a uuid := (select id from public.profiles where nom = 'Tom Admin');
  j uuid := (select id from public.profiles where nom = 'Julie');
  c_char uuid := (select id from public.categories where libelle = 'Char');
  c_cost uuid := (select id from public.categories where libelle = 'Costume');
  c_rang uuid := (select id from public.categories where libelle = 'Rangement fête');
  r record;
  s uuid;
begin
  for r in select * from (values
      ('2026-08-22'::date, c_char, 2.0, null::text, 0.5, a),
      ('2026-08-29', c_char, 2.0, null, 0.6, j),
      ('2026-09-05', c_char, 2.0, 'Montage de la structure', 0.8, a),
      ('2026-09-09', c_cost, 1.0, null, 0.5, j),
      ('2026-09-12', c_char, 2.0, null, 0.7, a),
      ('2026-09-16', c_cost, 1.0, 'Essayages', 0.6, j),
      ('2026-09-19', c_char, 2.0, 'Peinture', 0.75, a),
      ('2026-09-19', c_cost, 0.5, null, 0.4, j),
      ('2026-09-23', c_cost, 1.0, null, 0.55, j),
      ('2026-09-26', c_char, 2.0, null, 0.8, a),
      ('2026-09-27', c_rang, 1.0, 'Après la fête', 0.5, a)
    ) as t(d, cat, poids, remarque, taux, auteur)
  loop
    insert into public.seances (date, categorie_id, poids, remarque, created_by)
    values (r.d, r.cat, r.poids, r.remarque, r.auteur) returning id into s;
    -- Présents : tirage déterministe par membre et par séance.
    insert into public.presences (seance_id, membre_id, added_by)
    select s, m.id, r.auteur from public.membres m
    where (abs(hashtext(m.id::text || s::text)) % 100) < r.taux * 100
      and (not m.archive or r.d < '2026-09-10');
  end loop;
end $$;

-- Quelques demi-journées
update public.presences p set poids = 1
from public.seances s, public.membres m
where s.id = p.seance_id and m.id = p.membre_id and s.date = '2026-09-26' and m.prenom in ('Léa', 'Noah');
