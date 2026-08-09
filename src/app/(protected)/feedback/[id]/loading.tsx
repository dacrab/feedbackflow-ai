import { Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-16" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-60" />
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
