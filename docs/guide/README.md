# Guide d'utilisation

`guide-jcsd.pdf` : guide pour le comité (4 pages, captures annotées),
généré depuis `guide.html`. `guide-complet.html` est la version détaillée
(`node docs/guide/pdf.mjs guide-complet.html` → `guide-jcsd-complet.pdf`).
À régénérer quand l'interface change.

Les captures sont faites sur une base Supabase **locale** avec des membres
fictifs (`supabase/seed.sql` + `donnees-demo.sql`), jamais sur la production :
le document circule, et la vraie liste contient des mineurs.

## Régénérer

Prérequis : Podman, Google Chrome (`/usr/bin/google-chrome`, sinon variable `CHROME`).

```bash
# 1. Supabase local, dans un dossier hors du dépôt (la CLI y crée config.toml)
systemctl --user enable --now podman.socket
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
mkdir -p /tmp/jcsd-demo && cd /tmp/jcsd-demo && npx supabase init --force
cp ~/Documents/jcsd/supabase/migrations/*.sql supabase/migrations/
cp ~/Documents/jcsd/supabase/seed.sql supabase/seed.sql
npx supabase start -x studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector,supavisor,mailpit,postgres-meta
```

```bash
# 2. Comptes de démo (clé secrète affichée par `supabase start`), mot de passe demo-demo-1
SK=sb_secret_...
for u in "admin@demo.ch:Tom Admin" "julie@demo.ch:Julie" "nouveau@demo.ch:Marc"; do
  curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
    -H "apikey: $SK" -H "Authorization: Bearer $SK" -H "Content-Type: application/json" \
    -d "{\"email\":\"${u%%:*}\",\"password\":\"demo-demo-1\",\"email_confirm\":true,\"user_metadata\":{\"nom\":\"${u#*:}\"}}"
done
podman exec -i supabase_db_jcsd-demo psql -U postgres < ~/Documents/jcsd/docs/guide/donnees-demo.sql
```

Le nom du conteneur dépend du dossier (`supabase_db_<dossier>`) : `podman ps` pour le vérifier.

```bash
# 3. App sur la base locale (les variables d'environnement priment sur .env.local)
cd ~/Documents/jcsd
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
SUPABASE_SECRET_KEY=sb_secret_... \
npx next dev -p 3458
```

```bash
# 4. Captures puis PDF (autre terminal)
npm i --no-save playwright-core
GUIDE_URL=http://localhost:3458 node docs/guide/captures.mjs
node docs/guide/pdf.mjs
```

Les données de démo sont datées de septembre 2026 et le guide montre ce mois :
pour une autre date, adapter `donnees-demo.sql` et les URL de `captures.mjs`.

## Fonctionnement

- `captures.mjs` pilote Chrome en format téléphone (390 × 844). Pour chaque
  écran, il enregistre `captures/<id>.png` et la position des éléments
  annotés dans `captures/annotations.js`.
- `guide.html` : `<div class="tel" data-capture="id" data-cibles="6:g 5:bd">`
  pose un repère numéroté sur les cibles 6 et 5 de cet écran (numéros dans
  l'ordre de `captures.mjs`, côté du repère après les deux-points). La liste
  `ol.legendes` qui suit doit avoir autant d'entrées que de repères.
- `guide-complet.html` : chaque `<figure data-capture="id">` a une légende par
  cible, dans l'ordre de `captures.mjs`, reliée par une flèche.
- Un décompte qui ne correspond pas fait échouer `pdf.mjs`.
- `pdf.mjs` imprime la page en A4.
