'use client';

import { toast } from 'sonner';
import { usePayRunAction } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PayRun } from './types';
import { Button } from '@/components/ui/button';

const NEXT_ACTION: Partial<Record<PayRun['status'], { action: 'process' | 'approve' | 'pay' | 'close'; label: string }>> = {
  DRAFT: { action: 'process', label: 'Process' },
  PROCESSING: { action: 'approve', label: 'Approve' },
  APPROVED: { action: 'pay', label: 'Mark paid' },
  PAID: { action: 'close', label: 'Close' },
};

const CANCELLABLE_STATUSES: PayRun['status'][] = ['DRAFT', 'PROCESSING', 'APPROVED'];

export function PayRunLifecycleActions({ tenantId, payRun }: { tenantId: string; payRun: PayRun }) {
  const action = usePayRunAction(tenantId, payRun.id);
  const next = NEXT_ACTION[payRun.status];
  const canCancel = CANCELLABLE_STATUSES.includes(payRun.status);

  async function run(label: string, name: 'process' | 'approve' | 'pay' | 'close' | 'cancel') {
    try {
      await action.mutateAsync(name);
      toast.success(`Pay run ${label.toLowerCase()}d`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${label.toLowerCase()} pay run`));
    }
  }

  if (!next && !canCancel) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {next && (
        <Button onClick={() => run(next.label, next.action)} disabled={action.isPending}>
          {next.label}
        </Button>
      )}
      {canCancel && (
        <Button
          variant="outline"
          onClick={() => run('Cancel', 'cancel')}
          disabled={action.isPending}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
