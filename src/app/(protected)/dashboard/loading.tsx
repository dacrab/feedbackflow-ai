import { Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-24" />
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-24" />
        ))}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {[1, 2, 3, 4].map((k) => (
          <Skeleton key={k} className="h-64" />
        ))}
      </div>
    </div>
  );
}
