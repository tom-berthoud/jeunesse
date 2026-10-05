# JCSD — Présences de la jeunesse

Plan d'implémentation — 21 septembre 2026 (révisé : version minimale)

Application mobile (PWA) pour le comité de la jeunesse (~10 personnes). Un membre
du comité choisit un jour et une catégorie (char, costume…) et coche les personnes
présentes. L'app compte les présences par personne et montre l'historique sous
forme de calendrier.

---

## 1. Périmètre

**v1**

- Un compte par membre du comité, créé par un admin. Pas d'inscription publique.
- Liste des personnes de la jeunesse.
- Catégories libres, créées par le comité (Char, Costume, …).
- Une **séance** = un jour + une catégorie. On y coche les présents.
- Compteur de présences par personne, filtrable par catégorie et par période.
- Historique : calendrier mensuel + fiche par personne.

**Pas dans la v1** : points, classement pondéré, excusés, taux de présence,
hors-ligne, notifications. Ajoutables sans refonte si le besoin apparaît (§8).

## 2. Stack

Même base que `genoudb` et `edelparc` :

| Couche | Choix |
|---|---|
| Front + serveur | Next.js 16 (App Router) + TypeScript + React 19, Server Actions |
| Style | Tailwind CSS 4, composants maison |
| Base + auth | Supabase : Postgres, Auth (email + mot de passe), RLS |
| Accès données | `@supabase/ssr` côté serveur — repris d'`edelparc/lib/supabase/*` |
| Validation | zod |
| Hébergement | Vercel (Hobby, usage non commercial) |

Supabase Auth plutôt que l'auth maison de `genoudb` : ~10 comptes qui changent
chaque année, et la RLS peut s'appuyer sur `auth.uid()`.

## 3. Supabase

- **Slot** : edelparc mis en pause le 2026-09-21 → place pour un 2ᵉ projet actif
  avec GenoudB. Projet séparé de GenoudB (pas de mélange avec des données RH client).
- **Volume** : négligeable (quelques milliers de lignes par an).
- **Pause après 7 jours d'inactivité** : reprendre le workflow
  `.github/workflows/sauvegarde.yml` de `genoudb` (dump chiffré `age` + réveil).
- **E-mails** : le SMTP intégré n'envoie qu'aux adresses de l'équipe du projet.
  L'admin crée donc les comptes avec
  `auth.admin.createUser({ email, password, email_confirm: true })` et un mot de
  passe provisoire, à changer à la première connexion.

## 4. Modèle de données

Schéma de référence : `supabase/migrations/0001_init.sql` (ci-dessous, version
abrégée).

```sql
create type statut_membre as enum ('actif', 'passif');
create type role_comite as enum ('admin', 'comite');

-- Comité = utilisateurs de l'app
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null,
  role role_comite not null default 'comite',
  actif boolean not null default true,
  doit_changer_mdp boolean not null default true
);

-- Personnes de la jeunesse = celles qu'on pointe
create table membres (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  statut statut_membre not null default 'actif',  -- membre actif / passif de la société
  archive boolean not null default false          -- parti : masqué de la saisie, historique conservé
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  libelle text not null unique,                -- Char, Costume, …
  couleur text not null default '#6b7280',
  archivee boolean not null default false
);

create table seances (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  categorie_id uuid not null references categories (id),
  remarque text,
  poids numeric(3,1) not null default 1,       -- 0.5 demi-journée, 1, 2 journée complète
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  unique (date, categorie_id)                  -- un seul « Char » le même jour
);

create table presences (
  seance_id uuid references seances (id) on delete cascade,
  membre_id uuid references membres (id) on delete restrict,
  added_by uuid not null default auth.uid() references profiles (id),  -- RLS : = auth.uid()
  added_at timestamptz not null default now(),
  primary key (seance_id, membre_id)
);
```

### Décisions

- **Présent = une ligne, absent = pas de ligne.** Cocher insère, décocher supprime.
  Pas de statut à gérer.
- **`unique (date, categorie_id)`** : deux membres du comité qui ouvrent « Char du
  12 octobre » tombent sur la même séance au lieu d'en créer deux, ce qui
  doublerait le compteur. La création passe par
  `insert … on conflict (date, categorie_id) do nothing` puis lecture.
  Si un jour il faut deux séances de la même catégorie le même jour (matin / soir),
  il faudra lever cette contrainte.
- **Saisie à plusieurs** : chaque case cochée est une ligne indépendante, donc
  pas de conflit entre deux téléphones. Pas de bouton « Enregistrer ».
- **Poids de la séance** (`0001` + `0002_poids_seance.sql`) : une séance vaut
  0.5, 1 ou 2 présences. Porté par la séance et non par la présence : tout le
  monde y fait la même journée. Le jour où il faudra distinguer personne par
  personne, la colonne se déplacera sur `presences` sans toucher au reste.
- **Poids par personne** (`0004_poids_presence.sql`) : `presences.poids`,
  vide par défaut, remplace celui de la séance pour une personne (arrivée
  l'après-midi). Choisi au pointage (0.5, 1, 2) via la pastille d'une ligne cochée.
- **Actif / passif** est le statut du membre dans la société. Un membre parti
  passe `archive = true` : il disparaît de la saisie, ses présences restent.
- **Catégorie archivée** plutôt que supprimée, pour la même raison.
- **Catégories permanentes / ponctuelles** : seules les permanentes (Char,
  Costume, créées dans Réglages) sont des boutons sur la page d'un jour. Un
  nom tapé là (« Rangement fête ») crée une catégorie déjà archivée, ou
  réutilise celle qui porte ce nom, sans tenir compte de la casse (`0003`).

### Compteur

Un seul endroit calcule, pour que liste et fiche ne divergent pas. Une fonction
plutôt qu'une vue parce qu'elle prend des filtres :

```sql
create function compteur(p_debut date, p_fin date, p_categorie uuid default null)
returns table (membre_id uuid, prenom text, nom text, presences numeric)
language sql stable security invoker as $$
  select m.id, m.prenom, m.nom, coalesce(sum(s.poids), 0)
  from membres m
  left join presences p on p.membre_id = m.id
  left join seances s   on s.id = p.seance_id
                       and s.date between p_debut and p_fin
                       and (p_categorie is null or s.categorie_id = p_categorie)
  group by m.id
  order by coalesce(sum(s.poids), 0) desc, m.nom, m.prenom;
$$;
```

`coalesce` : avec les `left join`, `sum()` vaut `null` — et non 0 — pour un
membre sans présence. `security invoker` : la fonction respecte la RLS.

## 5. Sécurité

- RLS sur toutes les tables. Comité actif : lecture partout ; ajout et
  modification de `membres`, `categories`, `seances` ; cocher / décocher dans
  `presences`. Suppression d'une séance : son auteur ou un admin. Suppression
  de membres et catégories : admin. Comptes (`profiles.role`, `actif`) : clé
  secrète côté serveur uniquement.
- `is_comite()` / `is_admin()` en `security definer`, `set search_path = ''`,
  `execute` révoqué à `anon` (comme `edelparc/supabase/migrations/0003_security_hardening.sql`).
- Départ du comité : `profiles.actif = false` + bannissement du compte via l'API admin.
- `SUPABASE_SECRET_KEY` : uniquement dans les actions d'admin des comptes.
- **LPD** : prénom et nom seulement (membres possiblement mineurs).

## 6. Écrans (mobile d'abord)

Barre de navigation en bas, 3 entrées + admin.

| Route | Rôle |
|---|---|
| `/` | **Calendrier** du mois : chaque jour affiche des pastilles colorées par catégorie. Tap sur une pastille → la séance. Bouton « + » : nouvelle séance (date, aujourd'hui par défaut + catégorie) |
| `/seances/[id]` | **Saisie** : liste alphabétique des membres actifs, recherche, case à cocher par personne, compteur « 14 présents ». Poids de la séance dans les options |
| `/membres` | Compteur par personne, filtres catégorie + période — année civile, tout, ou deux dates libres (par défaut : année en cours), export CSV. Ajout d'une personne |
| `/membres/[id]` | Historique de la personne : liste des séances, total par catégorie |
| `/reglages` | Thème, nom, mot de passe, déconnexion. Catégories (tout le comité) ; comptes du comité (admin seul) |
| `/login` | Connexion |

Saisie : cibles tactiles ≥ 48 px, mise à jour optimiste (`useOptimistic`), et en
cas d'échec la case revient à son état avec un message. Une case cochée à l'écran
doit être en base.

## 7. Phases

| # | Phase | Terminé quand |
|---|---|---|
| 0 | Préparation | ✓ Projet Supabase créé, dépôt Git, Next initialisé, déployé sur Vercel |
| 1 | Schéma + RLS | ✓ `0001_init.sql`, `seed.sql` (Char, Costume, 16 membres fictifs), `npm run test:db` |
| 2 | Auth + comptes | ✓ Connexion, mdp provisoire changé à la 1ʳᵉ connexion, admin crée / désactive un compte |
| 3 | Membres | ✓ Liste, ajout, archivage, ajout en liste `Prénom ; Nom ; passif` |
| 4 | Séances + saisie | ✓ Validé sur téléphone : créer une séance et cocher 30 personnes en < 1 min |
| 5 | Calendrier + compteur + historique | ✓ Chiffres de `compteur()` vérifiés sur un petit jeu de données compté à la main |
| 6 | Prod | PWA installable, sauvegarde + réveil GitHub Actions, comptes du comité créés |

Phase 6 : `.github/workflows/sauvegarde.yml` en service (dump chiffré `age` le
lundi, réveil mercredi et samedi). Secret `SUPABASE_DB_URL` et variable
`AGE_PUBLIC_KEY` posés ; **restauration vérifiée le 2026-09-24** sur Postgres
jetable — seules erreurs, `create schema public` et la clé étrangère
`profiles_id_fkey` vers `auth.users`, hors du dump `--schema=public`. Icônes
PWA générées depuis le logo officiel (`design/logo.png` → `scripts/icones.py`).

## 8. Plus tard, si demandé

- Points par catégorie → classement (une colonne `points` sur `categories`).
- Hors-ligne, si le local capte mal.
- Accès lecture seule pour les membres.

## 9. À confirmer

- [ ] Période par défaut du compteur : année civile ou année de jeunesse
      (p. ex. septembre → août) ? Moins pressant depuis que `/membres` accepte
      deux dates libres, mais le défaut reste l'année civile.
- [ ] Barème des poids : 0.5 / 1 / 2 proposés. La base accepte tout multiple
      de 0,5 jusqu'à 5 (`lib/poids.ts` si le comité en veut d'autres).
- [x] Deux séances de la même catégorie le même jour : non, la contrainte
      d'unicité reste. Une journée plus longue se règle par le poids (2 au plus).
- [ ] Le compteur est-il montré aux membres de la jeunesse ?
