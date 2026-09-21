/** Nom de l'app avec son repère jaune — en attendant le logo officiel. */
export function Marque() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-lg font-bold tracking-tight text-on-accent">
        JCSD
      </span>
      <span className="text-sm font-medium text-ink-muted">Jeunesse de Châtel-St-Denis</span>
    </div>
  );
}
