// Captures du guide d'utilisation, sur une base locale remplie de données
// fictives (voir README.md). Pour chaque écran : une image PNG et la position
// des éléments annotés, que guide.html relie à leur légende par une flèche.
//
//   GUIDE_URL=http://localhost:3458 node docs/guide/captures.mjs

import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.GUIDE_URL ?? "http://localhost:3458";
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const SORTIE = new URL("./captures/", import.meta.url);
const MDP = "demo-demo-1";

// Écran d'un iPhone 15/16 ; ×2 pour une impression nette.
const APPAREIL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

// Indicateur de `next dev` : absent en production, pas dans le guide.
const SANS_DEV = "nextjs-portal{display:none!important}";

const annotations = {};

async function contexte(navigateur, email, theme = "light") {
  const ctx = await navigateur.newContext({ ...APPAREIL, colorScheme: theme, locale: "fr-CH", timezoneId: "Europe/Zurich" });
  const page = await ctx.newPage();
  page.on("load", () => page.addStyleTag({ content: SANS_DEV }).catch(() => {}));
  if (email) {
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder("E-mail").fill(email);
    await page.getByPlaceholder("Mot de passe").fill(MDP);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(`${BASE}/`);
  }
  return page;
}

async function aller(page, chemin) {
  await page.goto(`${BASE}${chemin}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Capture l'écran et la boîte de chaque cible. `cibles` : [locator, côté de la
 * flèche ("d" droite par défaut, "g" gauche, "h" haut, "b" bas)].
 */
async function capturer(page, id, cibles = []) {
  await page.addStyleTag({ content: SANS_DEV });
  await page.waitForTimeout(350);
  const boites = [];
  for (const [loc, cote = "d"] of cibles) {
    const b = await loc.first().boundingBox();
    if (!b) throw new Error(`${id} : cible introuvable (${loc})`);
    boites.push({ x: b.x, y: b.y, w: b.width, h: b.height, cote });
  }
  await page.screenshot({ path: new URL(`${id}.png`, SORTIE).pathname });
  annotations[id] = boites;
  console.log("✓", id);
}

// Format des champs de date (30/09/2026 et non 09/30/2026) : sous Linux,
// Chrome le prend dans LANG, pas dans --lang.
const navigateur = await chromium.launch({
  executablePath: CHROME,
  args: ["--lang=fr-CH"],
  env: { ...process.env, LANG: "fr_CH.UTF-8", LANGUAGE: "fr_CH:fr" },
});
await mkdir(SORTIE, { recursive: true });

// ── Connexion ────────────────────────────────────────────────────────
{
  const page = await contexte(navigateur, null);
  await aller(page, "/login");
  await capturer(page, "connexion", [
    [page.getByPlaceholder("E-mail")],
    [page.getByPlaceholder("Mot de passe")],
    [page.getByRole("button", { name: "Se connecter" })],
  ]);

  // Premier accès : compte créé avec un mot de passe provisoire.
  await page.getByPlaceholder("E-mail").fill("nouveau@demo.ch");
  await page.getByPlaceholder("Mot de passe").fill(MDP);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(`${BASE}/`);
  await page.waitForLoadState("networkidle");
  const champs = page.locator("input[type=password]");
  await capturer(page, "premier-mdp", [[page.getByRole("heading")], [champs.nth(0)], [page.getByRole("button").last()]]);
  await page.context().close();
}

// ── Admin : tout le parcours ─────────────────────────────────────────
const page = await contexte(navigateur, "admin@demo.ch");

await aller(page, "/?mois=2026-09");
await capturer(page, "calendrier", [
  [page.getByRole("heading", { name: /Septembre/ }), "b"],
  [page.getByLabel("Mois suivant"), "g"],
  [page.locator("a[href='/jour/2026-09-19']")],
  [page.locator("a[href='/jour/2026-09-28'] span").first()],
  [page.locator("a[href^='/seances/']").first()],
  [page.getByLabel("Nouvelle séance"), "g"],
  [page.getByRole("navigation", { name: "Navigation principale" }), "h"],
]);

await aller(page, "/jour/2026-09-28");
await capturer(page, "jour-vide", [
  [page.getByLabel("Jour suivant"), "g"],
  [page.locator("label:has(input[name=poids])").nth(2)],
  [page.getByRole("button", { name: "Char" })],
  [page.getByRole("button", { name: "Autre catégorie" })],
]);

await page.getByRole("button", { name: "Autre catégorie" }).click();
await page.getByPlaceholder("Nouvelle catégorie").fill("Rang");
await page.getByPlaceholder("Nouvelle catégorie").blur();
await capturer(page, "jour-ponctuelle", [
  [page.getByPlaceholder("Nouvelle catégorie")],
  [page.locator("form:has([name=libelle]) button[type=button]").first(), "g"],
  [page.getByRole("button", { name: "Créer" })],
]);

await aller(page, "/jour/2026-09-19");
await capturer(page, "jour-seances", [
  [page.locator("a[href^='/seances/']").first()],
  [page.locator("a[href^='/seances/'] span.truncate").first(), "b"],
  [page.getByPlaceholder("Nouvelle catégorie")],
]);

// Saisie : Char du 26 septembre, où Léa et Noah ont une demi-journée.
await aller(page, "/jour/2026-09-26");
await page.locator("a[href^='/seances/']").filter({ hasText: "Char" }).click();
await page.waitForURL(/\/seances\/[^/]+$/);
await page.waitForLoadState("networkidle");
const urlSaisie = page.url();
const ligne = (nom) => page.locator("li").filter({ hasText: nom });
await capturer(page, "saisie", [
  [page.getByPlaceholder("Rechercher")],
  [page.getByLabel(/présents sur/), "g"],
  [page.getByRole("button", { name: "Absents" }), "b"],
  [ligne("Chloé Perroud").locator("button").first()],
  [ligne("Emma Vial").locator("button").first()],
  [page.getByLabel(/^Poids de Léa/), "g"],
  [page.getByLabel("Options de la séance"), "g"],
]);

await page.getByLabel(/^Poids de Gabriel/).click();
await capturer(page, "saisie-poids", [
  [page.getByLabel(/^Poids de Gabriel/), "g"],
  [ligne("Gabriel Monnard").getByRole("button", { name: "1", exact: true })],
]);
await page.getByLabel(/^Poids de Gabriel/).click();

await page.getByPlaceholder("Rechercher").fill("zoe");
await capturer(page, "saisie-recherche", [[page.getByPlaceholder("Rechercher")], [page.locator("ul.card li").first()]]);

await page.goto(`${urlSaisie}/options`);
await page.waitForLoadState("networkidle");
await capturer(page, "options", [
  [page.locator("label:has(input[name=poids])").nth(2)],
  [page.getByPlaceholder("Remarque")],
  [page.getByText(/^Créée par/), "b"],
  [page.getByRole("button", { name: "Supprimer la séance" })],
]);

// ── Membres ──────────────────────────────────────────────────────────
await aller(page, "/membres?annee=2026");
await capturer(page, "membres", [
  [page.getByLabel("Exporter en CSV"), "g"],
  [page.getByLabel("Ajouter des membres"), "g"],
  [page.getByLabel("Période")],
  [page.getByLabel("Catégorie")],
  [page.getByLabel("Statut")],
  [page.getByText("Anciens membres")],
  [page.locator("ol li").first()],
  [page.locator("ol li").filter({ hasText: "passif" }).first().getByText("passif")],
]);

await aller(page, "/membres?annee=perso&debut=2026-09-01&fin=2026-09-30&archives=1");
await page.getByPlaceholder("Rechercher").fill("yann");
await capturer(page, "membres-dates", [
  [page.getByLabel("Début de la période")],
  [page.getByLabel("Fin de la période")],
  [page.locator("ol li").filter({ hasText: "Yann" })],
]);

await aller(page, "/membres?annee=2026");
await page.locator("ol a").filter({ hasText: "Léa Pittet" }).click();
await page.waitForURL(/\/membres\/[^/]+$/);
await page.waitForLoadState("networkidle");
const urlFiche = page.url();
await capturer(page, "fiche", [
  [page.getByLabel("Modifier"), "g"],
  [page.locator(".text-3xl").first()],
  [page.locator("main .flex-wrap span").first()],
  [page.locator("main ul.card a").first()],
]);

await page.goto(`${urlFiche}/modifier`);
await page.waitForLoadState("networkidle");
await capturer(page, "modifier", [
  [page.getByPlaceholder("Prénom")],
  [page.locator("label:has(input[name=statut])").nth(1)],
  [page.getByText("Ancien membre")],
]);

await aller(page, "/membres/nouveau");
await page.locator("summary").filter({ hasText: "Ajouter une liste" }).click();
await capturer(page, "ajout", [
  [page.getByPlaceholder("Prénom")],
  [page.getByRole("button", { name: "Ajouter", exact: true }).first()],
  [page.getByLabel("Liste des membres")],
]);

// ── Réglages ─────────────────────────────────────────────────────────
await aller(page, "/reglages");
await capturer(page, "reglages", [
  [page.getByRole("radiogroup", { name: "Apparence" })],
  [page.getByRole("link", { name: "Catégories" })],
  [page.getByRole("link", { name: "Comité" })],
  [page.locator("input[name=nom]")],
]);
await page.locator("#contenu").evaluate((m) => m.scrollTo(0, m.scrollHeight));
await capturer(page, "reglages-bas", [
  [page.locator("input[type=password]").first()],
  [page.getByRole("button", { name: "Se déconnecter" })],
]);

await aller(page, "/reglages/categories");
await page.locator("summary").filter({ hasText: "Costume" }).click();
await capturer(page, "categories", [
  [page.locator("summary").filter({ hasText: "Char" })],
  [page.locator("details[open] input[name=libelle]")],
  [page.locator("details[open] button[type=button]").first(), "g"],
  [page.locator("details[open]").getByText("Archivée")],
  [page.locator("summary").filter({ hasText: "Rangement" })],
]);
await page.locator("#contenu").evaluate((m) => m.scrollTo(0, m.scrollHeight));
await capturer(page, "categories-nouvelle", [[page.getByPlaceholder("Nouvelle catégorie")], [page.getByRole("button", { name: "Créer" })]]);

await aller(page, "/reglages/comite");
await page.locator("summary").filter({ hasText: "Julie" }).click();
await capturer(page, "comite", [
  [page.getByText(/^Dernière connexion/), "b"],
  [page.getByRole("button", { name: "Passer admin" })],
  [page.getByRole("button", { name: "Désactiver" }), "g"],
  [page.getByRole("button", { name: "Définir" }), "g"],
  [page.locator("summary").filter({ hasText: "Tom Admin" }).getByText("admin", { exact: true }), "g"],
]);
await page.locator("#contenu").evaluate((m) => m.scrollTo(0, m.scrollHeight));
await capturer(page, "comite-nouveau", [
  [page.locator("form:has(input[name=email]) input[name=nom]")],
  [page.locator("form:has(input[name=email]) input[name=email]")],
  [page.locator("form:has(input[name=email]) input[name=password]")],
  [page.getByRole("button", { name: "Créer le compte" })],
]);
await page.context().close();

// ── Membre du comité (non admin) et thème sombre ─────────────────────
{
  const p = await contexte(navigateur, "julie@demo.ch");
  await aller(p, "/reglages");
  await capturer(p, "reglages-comite", [[p.getByRole("link", { name: "Catégories" })]]);
  await p.context().close();

  const sombre = await contexte(navigateur, "julie@demo.ch", "dark");
  await aller(sombre, "/?mois=2026-09");
  await capturer(sombre, "calendrier-sombre");
  await sombre.context().close();
}

await navigateur.close();
// En script plutôt qu'en JSON : guide.html le charge aussi ouvert en file://.
await writeFile(new URL("annotations.js", SORTIE), `window.ANNOTATIONS = ${JSON.stringify(annotations, null, 1)};\n`);
console.log("annotations.js écrit");
