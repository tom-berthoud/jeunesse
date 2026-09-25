"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Le défilement a lieu dans <main>, pas dans le document : Next ne le remet
 * donc pas à zéro en changeant de page. Le pathname seul est surveillé, pour
 * qu'un changement de filtre (searchParams) ne fasse pas remonter la liste.
 */
export function ResetDefilement({ cible }: { cible: string }) {
  const pathname = usePathname();
  useEffect(() => {
    document.getElementById(cible)?.scrollTo({ top: 0 });
  }, [pathname, cible]);
  return null;
}
