export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-4 w-16 rounded bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 rounded border border-border bg-muted/30" />
          <div className="h-60 rounded border border-border bg-muted/30" />
        </div>
        <div className="h-48 rounded border border-border bg-muted/30" />
      </div>
    </div>
  );
}
