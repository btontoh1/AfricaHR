import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PayRunStatus } from './types';

const STAGES: { status: PayRunStatus; label: string; description: string }[] = [
  {
    status: 'DRAFT',
    label: 'Draft',
    description: 'This pay run has been created but payslips have not been calculated yet.',
  },
  {
    status: 'PROCESSING',
    label: 'Processing',
    description: 'Payslips have been calculated for every employee. No money has moved yet — this is just the numbers.',
  },
  {
    status: 'APPROVED',
    label: 'Approved',
    description: 'The payslip amounts are locked in. No money has moved yet — the next step sends real payments via Paystack.',
  },
  {
    status: 'PAID',
    label: 'Paid',
    description: 'Real payments have been sent to employees via Paystack. Check each employee’s status below — some may still be in progress.',
  },
  {
    status: 'CLOSED',
    label: 'Closed',
    description: 'This pay run is finalized and archived.',
  },
];

const STAGE_INDEX: Record<string, number> = Object.fromEntries(STAGES.map((s, i) => [s.status, i]));

export function PayRunStageTracker({ status }: { status: PayRunStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        This pay run was cancelled before it was paid. No money was sent for it.
      </div>
    );
  }

  const currentIndex = STAGE_INDEX[status] ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        {STAGES.map((stage, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={stage.status} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    !isComplete && !isCurrent && 'border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {isComplete ? <Check className="size-3.5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {index < STAGES.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1', isComplete ? 'bg-primary' : 'bg-muted-foreground/20')} />
              )}
            </div>
          );
        })}
      </div>
      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <span className="font-medium">{STAGES[currentIndex]?.label}: </span>
        <span className="text-muted-foreground">{STAGES[currentIndex]?.description}</span>
      </div>
    </div>
  );
}
