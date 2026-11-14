'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePayRunAction } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PayRun } from './types';
import { Button } from '@/components/ui/button';
import { useSession } from '@/app/(app)/session-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const NEXT_ACTION: Partial<
  Record<PayRun['status'], { action: 'process' | 'approve' | 'pay' | 'close'; label: string; helpText: string }>
> = {
  DRAFT: {
    action: 'process',
    label: 'Process',
    helpText: 'Calculates each employee’s payslip for this period. No money moves yet.',
  },
  PROCESSING: {
    action: 'approve',
    label: 'Approve',
    helpText: 'Locks in the payslip amounts shown below. No money moves yet.',
  },
  APPROVED: {
    action: 'pay',
    label: 'Send Payments',
    helpText: 'Sends a real payment to every employee via Paystack, straight to their bank account or mobile money. This cannot be undone.',
  },
  PAID: {
    action: 'close',
    label: 'Close',
    helpText: 'Archives this pay run once all payments have settled. Does not affect payments already sent.',
  },
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
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const canManage = MANAGE_TIER_ROLES.has(role);
  const rawNext = NEXT_ACTION[payRun.status];
  const next = rawNext && (!MANAGE_TIER_ACTIONS.has(rawNext.action) || canManage) ? rawNext : undefined;
  const canCancel = canManage && CANCELLABLE_STATUSES.includes(payRun.status);

  async function run(label: string, name: 'process' | 'approve' | 'pay' | 'close' | 'cancel') {
    try {
      await action.mutateAsync(name);
      toast.success(
        name === 'pay' ? 'Payments sent — check each employee’s status below' : `Pay run ${label.toLowerCase()}d`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${label.toLowerCase()} pay run`));
    }
  }

  if (!next && !canCancel) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {next && (
          <Button
            onClick={() => (next.action === 'pay' ? setConfirmPayOpen(true) : run(next.label, next.action))}
            disabled={action.isPending}
          >
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
      {next && <p className="text-xs text-muted-foreground">{next.helpText}</p>}

      <AlertDialog open={confirmPayOpen} onOpenChange={setConfirmPayOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send real payments via Paystack?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately send a real transfer to every employee in this pay run — straight to their
              bank account or mobile money via Paystack. Funds will be deducted from your Payroll Wallet. This
              cannot be undone once started.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmPayOpen(false);
                run('Send Payments', 'pay');
              }}
            >
              Yes, send payments now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
