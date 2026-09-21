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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
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
                "flex flex-col items-center gap-1 py-2.5 text-xs font-medium",
                on ? "text-brand" : "text-ink-faint hover:text-ink-muted",
              )}
            >
              <Icon size={22} strokeWidth={on ? 2.4 : 2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
