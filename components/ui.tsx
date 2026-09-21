import Link from "next/link";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
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
  primary: "bg-primary text-on-primary hover:opacity-90 active:opacity-80",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-muted hover:bg-surface-2 hover:text-ink",
  danger: "border border-danger/30 text-danger hover:bg-danger/10",
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

/** Bouton icône carré 44 px (navigation, retour). */
export function IconLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn("grid size-11 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink", className)}
    />
  );
}

/**
 * `text-base` (16 px) : iOS Safari zoome sur tout champ plus petit et ne
 * dézoome pas ensuite.
 */
const FIELD =
  "w-full min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink focus-brand";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(FIELD, "placeholder:text-ink-faint", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(FIELD, className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(FIELD, "py-2.5 placeholder:text-ink-faint", className)} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export function PageHeader({
  title,
  back,
  actions,
}: {
  title: ReactNode;
  back?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex min-h-11 items-center gap-1">
      {back && (
        <IconLink href={back} aria-label="Retour" className="-ml-2">
          <ChevronLeft size={24} />
        </IconLink>
      )}
      <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}

/** Titre de section, discret. */
export function Section({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2", className)}>
      {title && <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</h2>}
      {children}
    </section>
  );
}

/** Carte repliable : en-tête cliquable, contenu en dessous. */
export function Repli({
  entete,
  children,
  className,
}: {
  entete: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("card group", className)}>
      <summary className="flex min-h-13 cursor-pointer items-center gap-3 px-4 py-2 select-none">
        {entete}
        <ChevronDown size={18} className="ml-auto shrink-0 text-ink-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-line p-4">{children}</div>
    </details>
  );
}

/** Pastille colorée dont le texte bascule clair / sombre selon le fond. */
export function Pill({ color, children, className }: { color: string; children: ReactNode; className?: string }) {
  return (
    <span
      style={{ background: color, color: texteSur(color) }}
      className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", className)}
    >
      {children}
    </span>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "success"; children: ReactNode }) {
  const tones = {
    danger: "border-danger/30 bg-danger/10 text-danger",
    success: "border-success/30 bg-success/10 text-success",
  } as const;
  return <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}

export function StatutBadge({ statut }: { statut: "actif" | "passif" }) {
  return statut === "passif" ? (
    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">passif</span>
  ) : null;
}

/** Choix exclusif en boutons (radios natifs, donc utilisable dans un <form>). */
export function Segments<T extends string>({
  name,
  options,
  defaut,
}: {
  name: string;
  options: readonly { valeur: T; label: string }[];
  defaut: T;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <label
          key={o.valeur}
          className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-ink-muted has-[:checked]:bg-surface has-[:checked]:text-ink has-[:checked]:shadow-sm"
        >
          <input type="radio" name={name} value={o.valeur} defaultChecked={o.valeur === defaut} className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  );
}
