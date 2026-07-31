export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="h-24 rounded border border-border bg-muted/30" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="h-64 rounded border border-border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
