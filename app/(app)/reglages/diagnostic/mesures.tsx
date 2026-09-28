"use client";

import { useEffect, useState } from "react";

// Hauteur CSS réelle d'une unité (100dvh, env(...)…), mesurée sur un élément caché.
function hauteurCss(valeur: string) {
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;visibility:hidden;height:${valeur}`;
  document.body.appendChild(el);
  const h = el.getBoundingClientRect().height;
  el.remove();
  return Math.round(h * 10) / 10;
}

function mesurer(): [string, string | number][] {
  const vv = window.visualViewport;
  const nav = document.querySelector("nav[aria-label='Navigation principale']")?.getBoundingClientRect();
  const coquille = document.getElementById("contenu")?.parentElement?.getBoundingClientRect();
  return [
    ["Installée (standalone)", String(matchMedia("(display-mode: standalone)").matches || "standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)],
    ["screen.height", screen.height],
    ["innerHeight", innerHeight],
    ["documentElement.clientHeight", document.documentElement.clientHeight],
    ["visualViewport.height", vv ? Math.round(vv.height) : "—"],
    ["visualViewport.offsetTop", vv ? Math.round(vv.offsetTop) : "—"],
    ["100vh", hauteurCss("100vh")],
    ["100dvh", hauteurCss("100dvh")],
    ["100svh", hauteurCss("100svh")],
    ["100lvh", hauteurCss("100lvh")],
    ["safe-area top", hauteurCss("env(safe-area-inset-top)")],
    ["safe-area bottom", hauteurCss("env(safe-area-inset-bottom)")],
    ["coquille top / bottom", coquille ? `${Math.round(coquille.top)} / ${Math.round(coquille.bottom)}` : "—"],
    ["nav top / bottom", nav ? `${Math.round(nav.top)} / ${Math.round(nav.bottom)}` : "—"],
    ["userAgent", navigator.userAgent],
  ];
}

export function Mesures() {
  const [lignes, setLignes] = useState<[string, string | number][]>([]);
  const [historique, setHistorique] = useState<string[]>([]);

  useEffect(() => {
    const maj = (origine: string) => {
      setLignes(mesurer());
      setHistorique((h) => [`${origine} : innerHeight ${innerHeight}, dvh ${hauteurCss("100dvh")}`, ...h].slice(0, 8));
    };
    maj("chargement");
    const onResize = () => maj("resize");
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="space-y-4">
      <dl className="card divide-y divide-line text-sm">
        {lignes.map(([k, v]) => (
          <div key={k} className="flex gap-3 px-4 py-2">
            <dt className="w-44 shrink-0 text-ink-muted">{k}</dt>
            <dd className="min-w-0 break-words tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="card divide-y divide-line text-xs text-ink-muted">
        {historique.map((l, i) => (
          <li key={i} className="px-4 py-2 tabular-nums">{l}</li>
        ))}
      </ul>
    </div>
  );
}
