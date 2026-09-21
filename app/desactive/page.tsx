import { Button } from "@/components/ui";

export default function Desactive() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 text-center">
      <h1 className="text-xl font-semibold">Compte désactivé</h1>
      <form action="/logout" method="post">
        <Button variant="outline" className="w-full">Se déconnecter</Button>
      </form>
    </main>
  );
}
