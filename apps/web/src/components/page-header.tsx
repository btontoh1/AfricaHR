'use client';

import { useRouter } from 'next/navigation';
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
  /**
   * Renders a "Back" button above the title. Prefers real browser back
   * navigation (router.back()) so the page it returns to keeps its scroll
   * position, filters, and pagination exactly as the user left them -
   * navigating to backHref as a fresh Link would instead always land at
   * the top of that page. backHref is only used as a fallback for when
   * this page was opened directly (e.g. a bookmark or refresh) and there's
   * no in-app history to go back to.
   */
  backHref?: string;
}) {
  const router = useRouter();

  return (
    <div className="mb-6">
      {backHref && (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-2 text-muted-foreground"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(backHref);
            }
          }}
        >
          <ArrowLeft className="size-4" />
          Back
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
