@AGENTS.md

# JCSD — règles du projet

Référence : `PLAN.md`. Projets frères à réutiliser plutôt que réinventer :
`../edelparc` (Supabase Auth, RLS, PWA, bottom nav) et `../genoudb` (style du code,
Makefile, tests SQL, sauvegarde GitHub Actions).

## Next.js 16

- Lire `node_modules/next/dist/docs/` avant d'utiliser une API : elle diffère
  souvent des versions antérieures.
- `params` / `searchParams` sont des Promises.
- Protection des routes et rafraîchissement de session dans `proxy.ts`, pas `middleware.ts`.
- Pas de `next/font/google` : le build ne doit pas dépendre du réseau.

## Données

- Toute modification de schéma = nouvelle migration dans `supabase/migrations/`,
  jamais d'édition d'une migration déjà appliquée en production.
- RLS activée sur **toutes** les tables. Les vues : `with (security_invoker = true)`.
- Fonctions `security definer` : `set search_path = ''` et `revoke execute … from anon`.
- `presences` : présent = une ligne, absent = pas de ligne, jamais d'UPDATE.
  `added_by` / `created_by` valent `auth.uid()` par défaut et la RLS refuse une
  autre valeur : ne pas les passer depuis le code.
- Création de séance : `on conflict (date, categorie_id) do nothing`, jamais de doublon.
- Le compteur ne se calcule qu'à un endroit : la fonction SQL `compteur()`. Pas de
  recalcul en TypeScript.
- On ne supprime ni membre ni catégorie : `membres.archive` / `categories.archivee`.
  `membres.statut` (actif / passif) est le statut dans la société, sans rapport
  avec l'archivage.
- Comptes du comité : jamais supprimés, `profiles.actif = false`. Rôle et
  activation ne se modifient qu'avec la clé secrète (colonnes non accordées à
  `authenticated`).
- Tests SQL : `npm run test:db` (Podman, Postgres jetable, stub de `auth` dans
  `supabase/tests/_stub_auth.sql`). Toute nouvelle règle RLS = un test.
- Régénérer `lib/types/database.ts` après chaque migration.

## Auth

- Chaque page et chaque Server Action rappelle `requireComite()` ou `requireAdmin()` ;
  `proxy.ts` ne fait qu'un contrôle optimiste.
- `SUPABASE_SERVICE_ROLE_KEY` : uniquement dans les actions d'admin des comptes.

## Données personnelles

Membres potentiellement mineurs : prénom et nom. Rien d'autre sans décision
explicite (pas de date de naissance, téléphone).

## Vérification avant de rendre la main

```bash
npm run typecheck
npm run lint
npm run build
npm run test:db   # si supabase/ a changé
```
