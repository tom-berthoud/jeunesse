import { requireComite } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { PasswordForm } from "@/components/password-form";
import { ResetDefilement } from "@/components/reset-defilement";

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

  // Coquille d'application : c'est <main> qui défile, pas le document. Sinon
  // la barre d'URL du navigateur mobile se rétracte au défilement, la hauteur
  // du viewport change, et la barre de navigation — pourtant en bas — monte et
  // redescend avec elle.
  //
  // Coquille calée sur les bords (inset-0) et non h-dvh : en app installée
  // iOS (barre d'état translucide), dvh est parfois calculé trop court au
  // lancement et la barre flottait au-dessus du bas de l'écran. Le document
  // ne défilant pas, fixed ne suit plus la barre d'URL.
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <ResetDefilement cible="contenu" />
      <main
        id="contenu"
        className="mx-auto w-full max-w-2xl flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
