"use client";

import Form from "next/form";
import type { FormEvent, ReactNode } from "react";

/**
 * « Anciens membres » dans le statut implique la case : on les garde cohérents
 * avant d'envoyer, sinon l'URL porterait deux choix contradictoires.
 */
function synchroniserAnciens(e: FormEvent<HTMLFormElement>) {
  const form = e.currentTarget;
  const cible = e.target as HTMLInputElement | HTMLSelectElement;
  const statut = form.elements.namedItem("statut") as HTMLSelectElement | null;
  const archives = form.elements.namedItem("archives") as HTMLInputElement | null;
  if (!statut || !archives) return;
  if (cible === statut && statut.value === "anciens") archives.checked = true;
  if (cible === archives && !archives.checked && statut.value === "anciens") statut.value = "";
}

/** Formulaire GET qui se soumet à chaque changement (pas de bouton « Filtrer » au téléphone). */
export function Filtres({ children }: { children: ReactNode }) {
  return (
    <Form
      action="/membres"
      replace
      scroll={false}
      onChange={(e) => {
        synchroniserAnciens(e);
        e.currentTarget.requestSubmit();
      }}
      className="grid grid-cols-3 gap-2"
    >
      {children}
    </Form>
  );
}
