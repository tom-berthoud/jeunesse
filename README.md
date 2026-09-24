# JCSD — Présences de la jeunesse

PWA mobile pour le comité de la jeunesse : un jour + une catégorie (char,
costume…), on coche les présents. Compteur par personne, calendrier, historique.

**État : v1 fonctionnelle** (phases 0–5). Reste de la phase 6 : icônes PWA
(logo à fournir) et la mise en place des secrets de sauvegarde. Voir
[`PLAN.md`](PLAN.md).

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
| `/seances/[id]` | Saisie : un tap par personne, recherche, filtre présents / absents. Options : remarque, poids |
| `/membres` | Classement par présences (période, catégorie, statut) |
| `/membres/[id]` | Historique d'une personne, modification, archivage |
| `/membres/nouveau` | Ajout unitaire ou en liste (`Prénom ; Nom ; passif`) |
| `/reglages` | Nom, mot de passe, déconnexion |
| `/reglages/categories` | Renommer, recolorer, archiver |
| `/reglages/comite` | Admin : créer, désactiver, réinitialiser les comptes |

## Apparence

Noir et jaune, les couleurs de la Jeunesse. Mode clair, sombre ou système
(Réglages → Apparence). Jetons de couleur dans `app/globals.css`.

## Poids d'une séance

Une séance vaut 0.5, 1 ou 2 présences : une soirée de montage compte 1, une
journée complète 2, une demi-journée 0.5. Le choix se fait en ouvrant la séance
et se corrige ensuite dans ses options ; il porte sur la séance entière, pas sur
chaque personne. Le classement de `/membres` additionne ces poids — un seul
calcul, la fonction SQL `compteur()`.

## Période du classement

`/membres` compte sur l'année civile en cours par défaut. Le premier filtre
offre aussi les années précédentes, « Tout », et « Dates » pour deux bornes
libres (sélecteur de date natif au téléphone).

## Sauvegarde

`.github/workflows/sauvegarde.yml` : dump chiffré le lundi, simple connexion à
la base le mercredi et le samedi pour que le projet Supabase (plan Free) ne se
mette pas en pause après 7 jours d'inactivité.

À configurer une fois dans le dépôt GitHub :

| Où | Nom | Contenu |
|---|---|---|
| Secrets | `SUPABASE_DB_URL` | Connection string du pooler, mot de passe compris |
| Variables | `AGE_PUBLIC_KEY` | Clé publique `age` ; la privée reste hors du dépôt |

```bash
age-keygen -o ~/.config/jcsd-backup.key
```

Restauration — à essayer une fois, sinon le workflow ne prouve rien :

```bash
age -d -i ~/.config/jcsd-backup.key -o j.dump jcsd-AAAA-MM-JJ.dump.age
createdb jcsd_test
pg_restore -d jcsd_test --no-owner --no-privileges j.dump
```

GitHub désactive les workflows planifiés d'un dépôt sans activité pendant
60 jours (un e-mail prévient). Hors saison, vérifier que « Sauvegarde » tourne
encore, sinon le réveil s'arrête aussi.

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
