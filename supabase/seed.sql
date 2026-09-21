-- Données de départ. Idempotent : peut être rejoué sans créer de doublons.
-- Les membres sont FICTIFS, pour tester avant d'importer la vraie liste.

insert into public.categories (libelle, couleur, ordre) values
  ('Char',    '#b45309', 1),
  ('Costume', '#7c3aed', 2)
on conflict (libelle) do nothing;

insert into public.membres (prenom, nom, statut)
select v.prenom, v.nom, v.statut::public.statut_membre
from (values
  ('Léa',     'Pittet',    'actif'),
  ('Lucas',   'Genoud',    'actif'),
  ('Emma',    'Vial',      'actif'),
  ('Noah',    'Savoy',     'actif'),
  ('Chloé',   'Perroud',   'actif'),
  ('Nathan',  'Colliard',  'actif'),
  ('Zoé',     'Tâche',     'actif'),
  ('Louis',   'Liaudat',   'actif'),
  ('Manon',   'Currat',    'actif'),
  ('Gabriel', 'Monnard',   'actif'),
  ('Sarah',   'Pilloud',   'actif'),
  ('Théo',    'Suard',     'actif'),
  ('Julie',   'Maillard',  'passif'),
  ('Maxime',  'Dévaud',    'passif'),
  ('Laura',   'Bochud',    'passif'),
  ('Kevin',   'Grandjean', 'passif')
) as v (prenom, nom, statut)
where not exists (
  select 1 from public.membres m where m.prenom = v.prenom and m.nom = v.nom
);
