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
- `presences` : présent = une ligne, absent = pas de ligne. Seul UPDATE permis :
  `poids` (vide = poids de la séance).
  `added_by` / `created_by` valent `auth.uid()` par défaut et la RLS refuse une
  autre valeur : ne pas les passer depuis le code.
- Création de séance : `on conflict (date, categorie_id) do nothing`, jamais de doublon.
- Le classement ne se calcule qu'à un endroit : la fonction SQL `compteur()`.
  La fiche membre regroupe seulement les lignes qu'elle affiche.
- Types de la base : `lib/types/database.ts`, écrits à la main au format
  `supabase gen types`. À mettre à jour à chaque migration.
- Dates : chaînes `YYYY-MM-DD` et `lib/dates.ts` (fuseau Europe/Zurich). Pas de
  `new Date()` local en logique métier : Vercel tourne en UTC.
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

- Chaque page et chaque Server Action rappelle `requireComite()` ou `requireAdmin()`
  (`lib/auth.ts`) ; `proxy.ts` ne fait qu'un contrôle optimiste.
- `createAdminClient()` (clé secrète, contourne la RLS) : uniquement dans
  `app/(app)/reglages/comite/`, derrière `requireAdmin()`.

## Interface

- Épurée : pas de sous-titre, de phrase d'aide ou de texte décoratif. Un
  libellé n'existe que s'il est nécessaire pour comprendre ou agir. Pas d'emoji.
- Icônes : `lucide-react` uniquement.
- Couleurs : jetons de `app/globals.css` (`page`, `surface`, `ink`, `primary`,
  `accent`…), jamais de couleur Tailwind brute (`red-500`, `zinc-…`). Chaque
  jeton a sa valeur claire et sombre.
- Noir et jaune (Jeunesse de Châtel-St-Denis). Le jaune ne porte jamais de
  texte sur fond clair (contraste ≈ 1.6:1) : il sert de surface avec du texte
  noir (`bg-accent text-on-accent`).
- Thème : cookie `theme` (`light` / `dark`, absent = système), lu par
  `app/layout.tsx` → `data-theme` sur `<html>`.
- Majuscule des dates dans `lib/dates.ts`, pas avec CSS `capitalize`.

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
