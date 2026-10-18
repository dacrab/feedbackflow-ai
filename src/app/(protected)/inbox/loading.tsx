import { Rows, Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="flex h-full flex-col gap-4" role="status" aria-label="loading inbox">
      <Skeleton className="h-6 w-24" />
      {/* Bar and pager are siblings of the list in the real page. */}
      <Skeleton className="h-8 w-full max-w-xs" />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        <Rows>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
            <Skeleton key={k} className="h-14 rounded-none border-0" />
          ))}
        </Rows>
      </div>
      <Skeleton className="h-7 w-40" />
    </div>
  );
}
