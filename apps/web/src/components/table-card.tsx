import { cn } from '@/lib/utils';

/** Consistent bordered, rounded, soft-shadowed frame for a bare <Table>. */
export function TableCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card shadow-soft', className)}>
      {children}
    </div>
  );
}
