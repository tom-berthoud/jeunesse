import Image from "next/image";

/** Logo de la jeunesse et nom de la société, en tête de la page de connexion. */
export function Marque() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Image src="/icon-192.png" alt="" width={72} height={72} priority className="rounded-2xl" />
      <span className="text-sm font-medium text-ink-muted">Jeunesse de Châtel-St-Denis</span>
    </div>
  );
}
