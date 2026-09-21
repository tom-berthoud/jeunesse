"use client";

import { useOptimistic, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { changerTheme } from "./actions";
import { cn } from "@/components/ui";
import type { Theme } from "@/lib/theme";

const OPTIONS = [
  { valeur: "system", label: "Système", icon: Monitor },
  { valeur: "light", label: "Clair", icon: Sun },
  { valeur: "dark", label: "Sombre", icon: Moon },
] as const;

export function ThemeChoix({ theme }: { theme: Theme }) {
  const [courant, setCourant] = useOptimistic(theme);
  const [, startTransition] = useTransition();

  return (
    <div role="radiogroup" aria-label="Apparence" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
      {OPTIONS.map(({ valeur, label, icon: Icon }) => (
        <button
          key={valeur}
          role="radio"
          aria-checked={courant === valeur}
          onClick={() =>
            startTransition(async () => {
              setCourant(valeur);
              // Bascule immédiate ; le cookie fera foi au prochain rendu serveur.
              if (valeur === "system") delete document.documentElement.dataset.theme;
              else document.documentElement.dataset.theme = valeur;
              await changerTheme(valeur);
            })
          }
          className={cn(
            "flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors",
            courant === valeur ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
          )}
        >
          <Icon size={16} aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
