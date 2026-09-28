import Link from "next/link";
import { Bug, ChevronRight, LogOut, Tags, UserCog } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { lireTheme } from "@/lib/theme";
import { PageHeader, Section } from "@/components/ui";
import { PasswordForm } from "@/components/password-form";
import { NomForm } from "./nom-form";
import { ThemeChoix } from "./theme-choix";

export default async function Reglages() {
  const { profile, email } = await requireComite();
  const theme = await lireTheme();

  const liens = [
    { href: "/reglages/categories", label: "Catégories", icon: Tags },
    ...(profile.role === "admin" ? [{ href: "/reglages/comite", label: "Comité", icon: UserCog }] : []),
    // TEMPORAIRE : voir reglages/diagnostic.
    { href: "/reglages/diagnostic", label: "Diagnostic", icon: Bug },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Réglages" />

      <Section title="Apparence">
        <ThemeChoix theme={theme} />
      </Section>

      <ul className="card divide-y divide-line overflow-hidden">
        {liens.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-13 items-center gap-3 px-4 py-2 hover:bg-surface-2">
              <Icon size={20} className="text-ink-muted" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={18} className="text-ink-faint" />
            </Link>
          </li>
        ))}
      </ul>

      <Section title="Compte">
        <div className="card space-y-4 p-4">
          <p className="truncate text-sm text-ink-muted">{email}</p>
          <NomForm nom={profile.nom} />
        </div>
      </Section>

      <Section title="Mot de passe">
        <div className="card p-4">
          <PasswordForm />
        </div>
      </Section>

      <form action="/logout" method="post">
        <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10">
          <LogOut size={18} /> Se déconnecter
        </button>
      </form>
    </div>
  );
}
