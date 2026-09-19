import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PageHeader({
  title,
  description,
  action,
  backHref,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Renders a "Back" link above the title, pointing at the page this detail view was reached from - e.g. the list it was opened from. */
  backHref?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
