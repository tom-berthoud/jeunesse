"use client";

import Form from "next/form";
import type { ReactNode } from "react";

/** Formulaire GET qui se soumet à chaque changement (pas de bouton « Filtrer » au téléphone). */
export function Filtres({ children }: { children: ReactNode }) {
  return (
    <Form action="/membres" replace scroll={false} onChange={(e) => e.currentTarget.requestSubmit()} className="grid grid-cols-3 gap-2">
      {children}
    </Form>
  );
}
