import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Placeholder de la phase 0 : vérifie que la session Supabase fonctionne.
// Remplacé par le calendrier en phase 5.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">JCSD — Présences</h1>
      <p className="text-zinc-500">Connecté : {user.email}</p>
      <form action="/logout" method="post">
        <button className="h-12 rounded-lg border px-5">Se déconnecter</button>
      </form>
    </main>
  );
}
