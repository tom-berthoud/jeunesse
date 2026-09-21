-- JCSD — schéma initial
-- Tables : profiles (comité), membres (jeunesse), categories, seances, presences
-- + fonctions d'aide RLS, création automatique du profil, compteur de présences.

-- =============================================================
-- TYPES
-- =============================================================

create type public.role_comite as enum ('admin', 'comite');
create type public.statut_membre as enum ('actif', 'passif');

-- =============================================================
-- TABLES
-- =============================================================

-- Comité = utilisateurs de l'app. Un compte n'est jamais supprimé : on le
-- désactive (actif = false). Les FK de seances / presences empêchent d'ailleurs
-- la suppression d'un compte qui a déjà saisi quelque chose.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  role public.role_comite not null default 'comite',
  actif boolean not null default true,
  doit_changer_mdp boolean not null default true,
  created_at timestamptz not null default now()
);

-- Personnes de la jeunesse. `statut` = membre actif ou passif de la société.
-- `archive` = a quitté la jeunesse : masqué de la saisie, historique conservé.
create table public.membres (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (btrim(prenom) <> ''),
  nom text not null check (btrim(nom) <> ''),
  statut public.statut_membre not null default 'actif',
  archive boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  libelle text not null unique check (btrim(libelle) <> ''),
  couleur text not null default '#6b7280' check (couleur ~ '^#[0-9a-fA-F]{6}$'),
  ordre int not null default 0,
  archivee boolean not null default false,
  created_at timestamptz not null default now()
);

-- Une séance = un jour + une catégorie. L'unicité évite que deux membres du
-- comité créent chacun « Char du 12 octobre », ce qui doublerait le compteur.
create table public.seances (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  categorie_id uuid not null references public.categories (id),
  remarque text,
  created_by uuid default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (date, categorie_id)
);

-- Présent = une ligne, absent = pas de ligne. Pas d'UPDATE : on insère ou on supprime.
create table public.presences (
  seance_id uuid not null references public.seances (id) on delete cascade,
  membre_id uuid not null references public.membres (id),
  added_by uuid not null default auth.uid() references public.profiles (id),
  added_at timestamptz not null default now(),
  primary key (seance_id, membre_id)
);

create index presences_membre_idx on public.presences (membre_id);
create index seances_categorie_idx on public.seances (categorie_id);
-- seances (date) est déjà couvert par l'index de unique (date, categorie_id).

-- =============================================================
-- FONCTIONS D'AIDE RLS
-- =============================================================
-- security definer : lisent profiles sans repasser par sa propre RLS
-- (sinon la politique de profiles s'appellerait elle-même).

create function public.is_comite()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and actif
  );
$$;

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and actif and role = 'admin'
  );
$$;

revoke execute on function public.is_comite() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_comite() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- =============================================================
-- PROFIL AUTOMATIQUE À LA CRÉATION D'UN COMPTE
-- =============================================================

create function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nom'), ''),
             split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage : les comptes créés avant cette migration (le compte de
-- l'administrateur, créé à la main en phase 0) deviennent admin.
insert into public.profiles (id, nom, role, doit_changer_mdp)
select id, split_part(email, '@', 1), 'admin', false
from auth.users
on conflict (id) do nothing;

-- =============================================================
-- COMPTEUR — seul endroit où l'on compte les présences
-- =============================================================
-- security invoker : s'exécute avec les droits de l'appelant, donc sous RLS.

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
  presences bigint
)
language sql stable security invoker
set search_path = ''
as $$
  select m.id, m.prenom, m.nom, m.statut, m.archive,
         count(s.id)    -- pas count(*) : un membre sans présence vaudrait 1
  from public.membres m
  left join public.presences p on p.membre_id = m.id
  left join public.seances s   on s.id = p.seance_id
                              and s.date between p_debut and p_fin
                              and (p_categorie is null or s.categorie_id = p_categorie)
  group by m.id
  order by count(s.id) desc, m.nom, m.prenom;
$$;

revoke execute on function public.compteur(date, date, uuid) from public, anon;
grant execute on function public.compteur(date, date, uuid) to authenticated;

-- =============================================================
-- RLS
-- =============================================================
-- anon : aucun accès. Comité actif : lecture partout, saisie courante.
-- Admin : ce qui détruit ou touche aux comptes.

alter table public.profiles   enable row level security;
alter table public.membres    enable row level security;
alter table public.categories enable row level security;
alter table public.seances    enable row level security;
alter table public.presences  enable row level security;

revoke all on public.profiles, public.membres, public.categories,
              public.seances, public.presences from anon;

-- profiles : la gestion des comptes (rôle, activation) passe par la clé secrète
-- côté serveur. Un utilisateur ne peut modifier que son nom et son drapeau
-- de changement de mot de passe — pas son rôle.
create policy "profiles lecture" on public.profiles
  for select to authenticated using ((select public.is_comite()));
create policy "profiles soi-même" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from authenticated;
grant update (nom, doit_changer_mdp) on public.profiles to authenticated;

-- membres
create policy "membres lecture" on public.membres
  for select to authenticated using ((select public.is_comite()));
create policy "membres ajout" on public.membres
  for insert to authenticated with check ((select public.is_comite()));
create policy "membres modification" on public.membres
  for update to authenticated
  using ((select public.is_comite())) with check ((select public.is_comite()));
create policy "membres suppression" on public.membres
  for delete to authenticated using ((select public.is_admin()));

-- categories : le comité les crée, seul l'admin supprime
create policy "categories lecture" on public.categories
  for select to authenticated using ((select public.is_comite()));
create policy "categories ajout" on public.categories
  for insert to authenticated with check ((select public.is_comite()));
create policy "categories modification" on public.categories
  for update to authenticated
  using ((select public.is_comite())) with check ((select public.is_comite()));
create policy "categories suppression" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- seances : suppression par son auteur ou un admin
create policy "seances lecture" on public.seances
  for select to authenticated using ((select public.is_comite()));
create policy "seances ajout" on public.seances
  for insert to authenticated
  with check ((select public.is_comite()) and created_by = (select auth.uid()));
create policy "seances modification" on public.seances
  for update to authenticated
  using ((select public.is_comite())) with check ((select public.is_comite()));
create policy "seances suppression" on public.seances
  for delete to authenticated
  using ((select public.is_admin())
         or ((select public.is_comite()) and created_by = (select auth.uid())));

-- presences : cocher = insert, décocher = delete
create policy "presences lecture" on public.presences
  for select to authenticated using ((select public.is_comite()));
create policy "presences ajout" on public.presences
  for insert to authenticated
  with check ((select public.is_comite()) and added_by = (select auth.uid()));
create policy "presences retrait" on public.presences
  for delete to authenticated using ((select public.is_comite()));
revoke update on public.presences from authenticated;
