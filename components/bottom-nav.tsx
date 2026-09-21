"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Settings, Users } from "lucide-react";
import { cn } from "@/components/ui";

const items = [
  { href: "/", label: "Calendrier", icon: CalendarDays, actif: (p: string) => p === "/" || p.startsWith("/jour") || p.startsWith("/seances") },
  { href: "/membres", label: "Membres", icon: Users, actif: (p: string) => p.startsWith("/membres") },
  { href: "/reglages", label: "Réglages", icon: Settings, actif: (p: string) => p.startsWith("/reglages") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-3">
        {items.map(({ href, label, icon: Icon, actif }) => {
          const on = actif(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium",
                on ? "text-ink" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              {/* Repère jaune au-dessus de l'onglet actif */}
              <span className={cn("absolute top-0 h-0.5 w-10 rounded-full", on ? "bg-accent" : "bg-transparent")} />
              <Icon size={22} strokeWidth={on ? 2.25 : 1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
