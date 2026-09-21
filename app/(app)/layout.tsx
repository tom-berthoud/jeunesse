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
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 pb-16">
        <h1 className="text-xl font-semibold">Choisis ton mot de passe</h1>
        <PasswordForm />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
