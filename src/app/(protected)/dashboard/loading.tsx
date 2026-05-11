import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton gap="6">
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["a", "b", "c", "d"].map((k) => (
          <div key={k} className="h-24 rounded border border-border bg-muted/30" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {["e", "f", "g", "h"].map((k) => (
          <div key={k} className="h-64 rounded border border-border bg-muted/30" />
        ))}
      </div>
    </PageSkeleton>
  );
}
