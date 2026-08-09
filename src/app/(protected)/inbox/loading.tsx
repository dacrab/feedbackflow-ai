import { Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-full max-w-xs" />
      <div className="rounded border border-border divide-y divide-border">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
          <Skeleton key={k} className="h-14 rounded-none border-0" />
        ))}
      </div>
    </div>
  );
}
