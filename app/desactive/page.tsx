export default function Desactive() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Compte désactivé</h1>
      <p className="text-sm text-ink-muted">
        Ce compte ne fait plus partie du comité. Si c&apos;est une erreur, contacte un administrateur.
      </p>
      <form action="/logout" method="post">
        <button className="min-h-11 w-full rounded-lg border border-line bg-surface px-4 text-sm font-medium">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
