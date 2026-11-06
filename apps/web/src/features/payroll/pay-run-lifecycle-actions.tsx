'use client';

import { toast } from 'sonner';
import { usePayRunAction } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PayRun } from './types';
import { Button } from '@/components/ui/button';
import { useSession } from '@/app/(app)/session-provider';

const NEXT_ACTION: Partial<Record<PayRun['status'], { action: 'process' | 'approve' | 'pay' | 'close'; label: string }>> = {
  DRAFT: { action: 'process', label: 'Process' },
  PROCESSING: { action: 'approve', label: 'Approve' },
  APPROVED: { action: 'pay', label: 'Mark paid' },
  PAID: { action: 'close', label: 'Close' },
};

// 'process' (DRAFT -> PROCESSING) is prepare-tier (Permission.PAYROLL_PREPARE)
// - approve/pay/close and cancel are all approve-tier (Permission.PAYROLL_MANAGE),
// which PAYROLL_OFFICER deliberately doesn't hold. The backend already
// enforces this; hiding the buttons here just avoids an officer hitting a
// 403 on a button they can never use.
const MANAGE_TIER_ACTIONS: ReadonlySet<string> = new Set(['approve', 'pay', 'close']);
const MANAGE_TIER_ROLES: ReadonlySet<string> = new Set(['PLATFORM_ADMIN', 'TENANT_ADMIN', 'PAYROLL_MANAGER']);

const CANCELLABLE_STATUSES: PayRun['status'][] = ['DRAFT', 'PROCESSING', 'APPROVED'];

export function PayRunLifecycleActions({ tenantId, payRun }: { tenantId: string; payRun: PayRun }) {
  const action = usePayRunAction(tenantId, payRun.id);
  const { role } = useSession();
  const canManage = MANAGE_TIER_ROLES.has(role);
  const rawNext = NEXT_ACTION[payRun.status];
  const next = rawNext && (!MANAGE_TIER_ACTIONS.has(rawNext.action) || canManage) ? rawNext : undefined;
  const canCancel = canManage && CANCELLABLE_STATUSES.includes(payRun.status);

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
