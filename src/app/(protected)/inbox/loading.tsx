import { Rows, Skeleton } from "@/components/ui/ui";

export default function Loading() {
  return (
    <div className="flex flex-col h-full gap-4">
      <Skeleton className="h-6 w-24" />
      {/* Bar and pager are siblings of the list in the real page. */}
      <Skeleton className="h-8 w-full max-w-xs" />
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
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
