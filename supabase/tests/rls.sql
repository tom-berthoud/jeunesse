-- Tests de la migration 0001 : RLS, profil automatique, compteur.
-- Lancé par scripts/test-db.sh après _stub_auth.sql, les migrations et seed.sql.
\set ON_ERROR_STOP 1
\set QUIET 1

-- Deux comptes créés après la migration : le déclencheur doit créer le profil.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000c', 'comite@test.ch', '{"nom": "Anne Comité"}'),
  ('00000000-0000-0000-0000-00000000000d', 'ancien@test.ch', '{}');
update public.profiles set actif = false where id = '00000000-0000-0000-0000-00000000000d';

do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'admin',
    'le compte antérieur à la migration doit être admin';
  assert (select nom from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Anne Comité',
    'nom repris des métadonnées';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'comite',
    'nouveau compte = comite';
  assert (select count(*) from public.membres) = 16, 'seed : 16 membres';
  assert (select count(*) from public.categories) = 2, 'seed : 2 catégories';
end $$;

-- Seed rejouable sans doublon
\ir ../seed.sql
do $$ begin
  assert (select count(*) from public.membres) = 16, 'seed idempotent';
end $$;

-- ── anon : rien ────────────────────────────────────────────────
set role anon;
do $$ begin
  begin
    perform 1 from public.membres;
    raise exception 'ÉCHEC : anon lit membres';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ── comité actif ───────────────────────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$
declare
  v_char uuid := (select id from public.categories where libelle = 'Char');
  v_s1 uuid; v_s2 uuid; n int;
begin
  assert (select count(*) from public.membres) = 16, 'comité lit les membres';

  insert into public.seances (date, categorie_id) values ('2026-10-03', v_char) returning id into v_s1;
  insert into public.seances (date, categorie_id) values ('2026-10-10', v_char) returning id into v_s2;

  -- Même jour + même catégorie : refusé
  begin
    insert into public.seances (date, categorie_id) values ('2026-10-03', v_char);
    raise exception 'ÉCHEC : séance en double acceptée';
  exception when unique_violation then null;
  end;

  -- Léa : 2 présences, Lucas : 1
  insert into public.presences (seance_id, membre_id)
    select v_s1, id from public.membres where prenom in ('Léa', 'Lucas');
  insert into public.presences (seance_id, membre_id)
    select v_s2, id from public.membres where prenom = 'Léa';
  assert (select added_by from public.presences limit 1) = '00000000-0000-0000-0000-00000000000c',
    'added_by = auth.uid() par défaut';

  -- Se faire passer pour un autre : refusé
  begin
    insert into public.presences (seance_id, membre_id, added_by)
      select v_s2, id, '00000000-0000-0000-0000-00000000000a' from public.membres where prenom = 'Emma';
    raise exception 'ÉCHEC : added_by usurpé accepté';
  exception when insufficient_privilege then null;
  end;

  -- Compteur
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Léa') = 2, 'Léa = 2';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Lucas') = 1, 'Lucas = 1';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Emma') = 0,
    'sans présence = 0, pas 1';
  assert (select presences from public.compteur('2026-10-05', '2026-12-31') where prenom = 'Léa') = 1,
    'filtre de période';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31',
          (select id from public.categories where libelle = 'Costume')) where prenom = 'Léa') = 0,
    'filtre de catégorie';

  -- Poids : journée complète = 2, demi-journée = 0.5
  update public.seances set poids = 2 where id = v_s1;
  update public.seances set poids = 0.5 where id = v_s2;
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Léa') = 2.5,
    'Léa = 2 + 0.5';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Lucas') = 2,
    'Lucas = 2';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Emma') = 0,
    'sans présence = 0 même avec des poids';

  -- Poids hors barème
  begin
    update public.seances set poids = 0 where id = v_s1;
    raise exception 'ÉCHEC : poids nul accepté';
  exception when check_violation then null;
  end;
  begin
    update public.seances set poids = 1.25 where id = v_s1;
    raise exception 'ÉCHEC : poids hors demi accepté';
  exception when check_violation then null;
  end;

  -- Seuls la remarque et le poids sont modifiables
  update public.seances set remarque = 'Pluie' where id = v_s1;
  begin
    update public.seances set date = '2026-10-04' where id = v_s1;
    raise exception 'ÉCHEC : date d''une séance modifiable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.seances set created_by = '00000000-0000-0000-0000-00000000000a' where id = v_s1;
    raise exception 'ÉCHEC : created_by modifiable';
  exception when insufficient_privilege then null;
  end;

  -- Le comité crée une catégorie mais ne supprime pas
  insert into public.categories (libelle) values ('Soirée');
  delete from public.categories where libelle = 'Soirée';
  get diagnostics n = row_count;
  assert n = 0, 'comité ne supprime pas une catégorie';

  -- Pas d'élévation de rôle
  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000c';
    raise exception 'ÉCHEC : le comité s''est promu admin';
  exception when insufficient_privilege then null;
  end;
  update public.profiles set nom = 'Anne' where id = '00000000-0000-0000-0000-00000000000c';
  update public.profiles set nom = 'Piraté' where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'modifier le nom d''un autre';

  -- Décocher
  delete from public.presences where seance_id = v_s2;
  get diagnostics n = row_count;
  assert n = 1, 'décocher une présence';

  -- Supprimer sa propre séance
  delete from public.seances where id = v_s2;
  get diagnostics n = row_count;
  assert n = 1, 'l''auteur supprime sa séance';
end $$;
reset role;

-- ── 0003 : nom de catégorie unique sans tenir compte de la casse ──
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  begin
    insert into public.categories (libelle) values ('char');
    raise exception 'ÉCHEC : « char » accepté à côté de « Char »';
  exception when unique_violation then null;
  end;
end $$;
reset role;

-- ── 0004 : poids par personne ──────────────────────────────────
-- État hérité : séance du 2026-10-03 (poids 2) avec Léa et Lucas.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Lucas') = 2,
    'sans poids personnel : celui de la séance';

  update public.presences set poids = 1
  where membre_id = (select id from public.membres where prenom = 'Lucas');
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Lucas') = 1,
    'poids personnel prioritaire';
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Léa') = 2,
    'les autres gardent le poids de la séance';
  assert (select presences from public.compteur('2027-01-01', '2027-12-31') where prenom = 'Lucas') = 0,
    'poids personnel hors période : non compté';

  begin
    update public.presences set poids = 1.25;
    raise exception 'ÉCHEC : poids personnel hors demi accepté';
  exception when check_violation then null;
  end;
  begin
    update public.presences set added_by = '00000000-0000-0000-0000-00000000000a';
    raise exception 'ÉCHEC : added_by modifiable';
  exception when insufficient_privilege then null;
  end;

  update public.presences set poids = null
  where membre_id = (select id from public.membres where prenom = 'Lucas');
  assert (select presences from public.compteur('2026-01-01', '2026-12-31') where prenom = 'Lucas') = 2,
    'poids vide : retour au poids de la séance';
end $$;
reset role;

-- ── comité désactivé : plus rien ───────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
do $$ begin
  assert (select count(*) from public.membres) = 0, 'compte désactivé ne lit rien';
  begin
    insert into public.membres (prenom, nom) values ('X', 'Y');
    raise exception 'ÉCHEC : compte désactivé écrit';
  exception when insufficient_privilege then null;
  end;
end $$;
do $$ declare n int; begin
  update public.presences set poids = 1;
  get diagnostics n = row_count;
  assert n = 0, 'compte désactivé ne change aucun poids';
end $$;
reset role;

-- ── admin : supprime une catégorie ─────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$ declare n int; begin
  delete from public.categories where libelle = 'Soirée';
  get diagnostics n = row_count;
  assert n = 1, 'admin supprime une catégorie';
end $$;
reset role;

\echo '✓ supabase/tests/rls.sql'
