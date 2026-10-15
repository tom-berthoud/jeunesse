"use client";

import { useState } from "react";
import { Download } from "lucide-react";

/**
 * Export du classement. Au téléphone, feuille de partage (Fichiers, Mail…) :
 * un lien `download` ouvre le CSV en plein écran dans la PWA iOS, sans moyen
 * d'en revenir. À l'ordinateur, téléchargement classique.
 */
export function ExportCsv({ href }: { href: string }) {
  const [enCours, setEnCours] = useState(false);

  async function exporter() {
    setEnCours(true);
    try {
      const rep = await fetch(href, { cache: "no-store" });
      if (!rep.ok) throw new Error(`export : ${rep.status}`);
      const nom = /filename="([^"]+)"/.exec(rep.headers.get("Content-Disposition") ?? "")?.[1] ?? "classement.csv";
      const fichier = new File([await rep.blob()], nom, { type: "text/csv" });

      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [fichier] })) {
        try {
          await navigator.share({ files: [fichier] });
          return;
        } catch (e) {
          // Partage annulé par l'utilisateur : rien à faire.
          if (e instanceof DOMException && e.name === "AbortError") return;
          // Autre refus (p. ex. geste jugé trop ancien après le fetch) : téléchargement.
        }
      }

      const url = URL.createObjectURL(fichier);
      const a = document.createElement("a");
      a.href = url;
      a.download = nom;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error(e);
      alert("L'export a échoué.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exporter}
      disabled={enCours}
      aria-label="Exporter en CSV"
      className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50"
    >
      <Download size={22} />
    </button>
  );
}
