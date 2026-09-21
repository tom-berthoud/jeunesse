import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { texteSur } from "@/lib/couleurs";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// Hauteur 44 px minimum : cible tactile confortable au pouce.
const BTN =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 " +
  "text-sm font-medium transition-colors focus-brand disabled:opacity-50 " +
  "disabled:pointer-events-none whitespace-nowrap";

const VARIANTS = {
  primary: "bg-brand text-white active:bg-brand-700 hover:bg-brand-600",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-danger/30 bg-surface text-danger hover:bg-red-50",
} as const;

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button {...props} className={cn(BTN, VARIANTS[variant], className)} />;
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={cn(BTN, VARIANTS[variant], className)} />;
}

/**
 * `text-base` (16 px) : iOS Safari zoome sur tout champ plus petit et ne
 * dézoome pas ensuite.
 */
const FIELD =
  "w-full min-h-11 rounded-lg border border-line bg-surface px-3 text-base focus-brand";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(FIELD, "placeholder:text-ink-faint", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(FIELD, className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start gap-2">
      {back && (
        <Link
          href={back}
          aria-label="Retour"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-surface"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <div className="min-w-0 flex-1 pt-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>}
    </header>
  );
}

/** Pastille colorée dont le texte bascule clair / sombre selon le fond. */
export function Pill({ color, children, className }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span
      style={{ background: color, color: texteSur(color) } as CSSProperties}
      className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", className)}
    >
      {children}
    </span>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "danger" | "success"; children: ReactNode }) {
  const tones = {
    info: "bg-brand-50 text-brand-700 border-brand-200",
    danger: "bg-red-50 text-red-900 border-red-200",
    success: "bg-green-50 text-green-900 border-green-200",
  } as const;
  return <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="card px-4 py-10 text-center text-sm text-ink-muted">{children}</p>;
}

export function StatutBadge({ statut }: { statut: "actif" | "passif" }) {
  return statut === "passif" ? (
    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">passif</span>
  ) : null;
}
