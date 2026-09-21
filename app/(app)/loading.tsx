export default function Loading() {
  return (
    <div className="space-y-3 pt-2" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-40 animate-pulse rounded bg-line" />
      <div className="h-48 animate-pulse rounded-xl bg-line/60" />
      <div className="h-24 animate-pulse rounded-xl bg-line/60" />
    </div>
  );
}
