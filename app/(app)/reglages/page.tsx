import Link from "next/link";
import { ChevronRight, LogOut, Tags, UserCog } from "lucide-react";
import { requireComite } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "@/components/password-form";
import { NomForm } from "./nom-form";

export default async function Reglages() {
  const { profile, email } = await requireComite();

  const liens = [
    { href: "/reglages/categories", label: "Catégories", icon: Tags },
    ...(profile.role === "admin" ? [{ href: "/reglages/comite", label: "Comptes du comité", icon: UserCog }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Réglages" subtitle={`${email}${profile.role === "admin" ? " · admin" : ""}`} />

      <ul className="card divide-y divide-line">
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

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-ink-muted">Mon nom</h2>
        <NomForm nom={profile.nom} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-ink-muted">Mot de passe</h2>
        <div className="card p-4">
          <PasswordForm />
        </div>
      </section>

      <form action="/logout" method="post">
        <button className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-danger hover:bg-red-50">
          <LogOut size={18} /> Se déconnecter
        </button>
      </form>
    </div>
  );
}
