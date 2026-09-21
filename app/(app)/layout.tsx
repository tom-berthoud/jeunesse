import { requireComite } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { PasswordForm } from "@/components/password-form";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireComite();

  // Compte créé par un admin avec un mot de passe provisoire : on bloque
  // l'app tant qu'il n'est pas changé. Rendu ici plutôt qu'une redirection,
  // qui bouclerait sur sa propre page.
  if (profile.doit_changer_mdp) {
    return (
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
        <h1 className="text-xl font-semibold">Bienvenue, {profile.nom}</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">
          Ton compte a été créé avec un mot de passe provisoire. Choisis le tien pour continuer.
        </p>
        <PasswordForm />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
