export default function Loading() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        <div className="xl:col-span-2 h-64 rounded border border-border bg-muted/30" />
        <div className="h-64 rounded border border-border bg-muted/30" />
        <div className="h-48 rounded border border-border bg-muted/30" />
        <div className="h-48 rounded border border-border bg-muted/30" />
      </div>
    </div>
  );
}
