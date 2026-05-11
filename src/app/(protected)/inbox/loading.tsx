import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton>
      <div className="h-6 w-24 rounded bg-muted" />
      <div className="h-8 w-full max-w-xs rounded bg-muted/30" />
      <div className="rounded border border-border divide-y divide-border">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
          <div key={k} className="h-14 bg-muted/20" />
        ))}
      </div>
    </PageSkeleton>
  );
}
