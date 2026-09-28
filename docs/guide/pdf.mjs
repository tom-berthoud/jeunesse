// Guide HTML → PDF A4, avec le Chrome installé.
//
//   node docs/guide/pdf.mjs                     guide.html → guide-jcsd.pdf
//   node docs/guide/pdf.mjs guide-complet.html  → guide-jcsd-complet.pdf

import { chromium } from "playwright-core";

const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const source = process.argv[2] ?? "guide.html";
const guide = new URL(`./${source}`, import.meta.url);
const sortie = new URL(`./${source.replace(/^guide/, "guide-jcsd").replace(/\.html$/, ".pdf")}`, import.meta.url).pathname;

const navigateur = await chromium.launch({ executablePath: CHROME });
const page = await navigateur.newPage();
const erreurs = [];
page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
page.on("pageerror", (e) => erreurs.push(e.message));

// Mise en page d'impression avant le calcul des flèches, qui dépend des dimensions.
await page.emulateMedia({ media: "print" });
await page.goto(guide.href);
await page.waitForSelector("body[data-pret]");
if (erreurs.length) {
  console.error(erreurs.join("\n"));
  process.exit(1);
}

await page.pdf({ path: sortie, preferCSSPageSize: true, printBackground: true });
await navigateur.close();
console.log(sortie);
