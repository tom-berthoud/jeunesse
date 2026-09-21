# JCSD — Présences de la jeunesse

PWA mobile pour le comité de la jeunesse : un jour + une catégorie (char,
costume…), on coche les présents. Compteur par personne, calendrier, historique.

**État : phase 0** — échafaudage Next.js + connexion Supabase. Voir [`PLAN.md`](PLAN.md).

## Démarrer

```bash
cp .env.example .env.local   # remplir avec les clés du projet Supabase
npm install
npm run dev
```

→ <http://localhost:3000>. Les comptes se créent dans Supabase
(Authentication → Users) tant que l'écran d'admin n'existe pas.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run typecheck` | Génère les types de routes puis `tsc` |
| `npm run lint` | ESLint |
| `npm run build` | Build de production |

## Stack

- Next.js 16 (App Router) + TypeScript + React 19 + Tailwind CSS 4
- Supabase : Postgres, Auth (email + mot de passe), RLS — `@supabase/ssr`
- Vercel

## Documents

| Fichier | Contenu |
|---|---|
| `PLAN.md` | Périmètre, schéma, sécurité, écrans, phases, questions ouvertes |
| `CLAUDE.md` | Règles de travail sur le dépôt |

Suivi du projet (pourquoi, backlog, retours du comité) : note Obsidian
`vault/Projets/JCSD/JCSD.md`.
