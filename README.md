# JCSD — Présences de la jeunesse

PWA mobile pour le comité de la jeunesse : un jour + une catégorie (char,
costume…), on coche les présents. Compteur par personne, calendrier, historique.

**État : v1 fonctionnelle** (phases 0–5). Reste la phase 6 : icônes PWA, sauvegarde. Voir [`PLAN.md`](PLAN.md).

## Démarrer

```bash
cp .env.example .env.local   # remplir avec les clés du projet Supabase
npm install
npm run dev
```

→ <http://localhost:3000>. En local, l'app parle à la base Supabase de
production : ce que tu saisis en local est réel.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Génère les types de routes puis `tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Build de production |
| `npm run test:db` | Tests SQL (migrations + RLS) sur Postgres jetable, via Podman |

## Stack

- Next.js 16 (App Router) + TypeScript + React 19 + Tailwind CSS 4
- Supabase : Postgres, Auth (email + mot de passe), RLS — `@supabase/ssr`
- Vercel

## Écrans

| Route | Rôle |
|---|---|
| `/` | Calendrier du mois, pastilles par catégorie, liste des séances |
| `/jour/[date]` | Séances du jour, ouvrir une séance, créer une catégorie |
| `/seances/[id]` | Saisie : un tap par personne, recherche, filtre présents / absents |
| `/membres` | Classement par nombre de présences (année, catégorie, statut) |
| `/membres/[id]` | Historique d'une personne, modification, archivage |
| `/membres/nouveau` | Ajout unitaire ou en liste (`Prénom ; Nom ; passif`) |
| `/reglages` | Nom, mot de passe, déconnexion |
| `/reglages/categories` | Renommer, recolorer, archiver |
| `/reglages/comite` | Admin : créer, désactiver, réinitialiser les comptes |

## Apparence

Noir et jaune, les couleurs de la Jeunesse. Mode clair, sombre ou système
(Réglages → Apparence). Jetons de couleur dans `app/globals.css`.

## Comptes

Pas d'e-mail : un admin crée le compte dans `/reglages/comite` avec un mot de
passe provisoire, qu'il transmet lui-même. Le nouveau membre doit le changer à
la première connexion. Désactiver un compte le bloque (profil + bannissement
Supabase) sans effacer ce qu'il a saisi.

## Documents

| Fichier | Contenu |
|---|---|
| `PLAN.md` | Périmètre, schéma, sécurité, écrans, phases, questions ouvertes |
| `CLAUDE.md` | Règles de travail sur le dépôt |

Suivi du projet (pourquoi, backlog, retours du comité) : note Obsidian
`vault/Projets/JCSD/JCSD.md`.
