export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-6 w-24 rounded bg-muted" />
      <div className="h-8 w-full max-w-xs rounded bg-muted/30" />
      <div className="rounded border border-border divide-y divide-border">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
          <div key={k} className="h-14 bg-muted/20" />
        ))}
      </div>
    </div>
  );
}
