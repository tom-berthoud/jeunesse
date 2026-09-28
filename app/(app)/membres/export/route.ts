import type { NextRequest } from "next/server";
import { requireComite } from "@/lib/auth";
import { lireFiltres, rangs, type ParamsClassement } from "../filtres-classement";

/**
 * Champ CSV : entre guillemets si besoin (`;`, guillemet, retour à la ligne).
 * Un nom commençant par `=`, `+`, `-` ou `@` serait lu comme une formule par
 * Excel : l'apostrophe le force en texte.
 */
const champ = (v: string | number) => {
  const s = typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/**
 * Classement en CSV avec les filtres de `/membres`. Séparateur `;` et BOM
 * UTF-8 : Excel en réglages suisses ouvre le fichier directement, accents
 * compris.
 */
export async function GET(request: NextRequest) {
  const { supabase } = await requireComite();
  const f = lireFiltres(Object.fromEntries(request.nextUrl.searchParams) as ParamsClassement);

  const { data, error } = await supabase.rpc("compteur", {
    p_debut: f.periode.debut,
    p_fin: f.periode.fin,
    p_categorie: f.categorie || null,
  });
  if (error) return new Response(error.message, { status: 500 });

  const lignes = (data ?? []).filter((m) => (f.archives || !m.archive) && (!f.statut || m.statut === f.statut));
  const r = rangs(lignes);

  const csv = [
    ["Rang", "Prénom", "Nom", "Statut", "Présences"],
    ...lignes.map((m, i) => [r[i], m.prenom, m.nom, m.statut, m.presences]),
  ]
    .map((l) => l.map(champ).join(";"))
    .join("\r\n");

  const nom = f.mode === "tout" ? "classement" : `classement-${f.periode.debut}-${f.periode.fin}`;
  return new Response(`﻿${csv}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nom}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
