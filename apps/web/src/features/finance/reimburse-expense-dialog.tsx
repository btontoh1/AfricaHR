'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useReimburseExpense } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ReimburseExpenseDialog({
  tenantId,
  expenseId,
  description,
}: {
  tenantId: string;
  expenseId: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);
  const reimburseExpense = useReimburseExpense(tenantId);

  async function handleReimburse() {
    try {
      await reimburseExpense.mutateAsync({ id: expenseId });
      toast.success('Expense marked reimbursed');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to mark expense reimbursed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Mark reimbursed
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark &quot;{description}&quot; as reimbursed?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Posts Dr Expense Reimbursements Payable / Cr Cash and Bank - confirm the employee has actually been
          paid back before doing this.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={reimburseExpense.isPending}>
            Cancel
          </Button>
          <Button onClick={handleReimburse} disabled={reimburseExpense.isPending}>
            {reimburseExpense.isPending ? 'Saving…' : 'Mark reimbursed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
