import { Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="loading settings">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 xl:col-span-2" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
