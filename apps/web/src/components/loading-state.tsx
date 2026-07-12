import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Row-shaped skeleton for table/list views - the most common loading case. */
export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Block-shaped skeleton for card/detail views. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-card p-6', className)} role="status" aria-label="Loading">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
