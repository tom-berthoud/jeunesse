"use client";

import { Check } from "lucide-react";
import { PALETTE, texteSur } from "@/lib/couleurs";

export function ChoixCouleur({ valeur, onChange }: { valeur: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
      {PALETTE.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={p === valeur}
          aria-label={p}
          onClick={() => onChange(p)}
          style={{ background: p, color: texteSur(p) }}
          className="grid size-9 place-items-center rounded-full"
        >
          {p === valeur && <Check size={18} strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}
