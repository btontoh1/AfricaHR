'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDeleteEmployee } from './queries';
import type { Employee } from './types';
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

export function DeleteEmployeeDialog({ tenantId, employee }: { tenantId: string; employee: Employee }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteEmployee = useDeleteEmployee(tenantId, employee.id);
  const employeeName = `${employee.firstName} ${employee.lastName}`;

  async function handleDelete() {
    try {
      await deleteEmployee.mutateAsync();
      toast.success(`"${employeeName}" removed`);
      setOpen(false);
      router.push('/employees');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove employee'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{employeeName}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This removes {employeeName} from employee lists, org charts, and pickers. Their payroll, leave,
          and performance history is retained for records and audit purposes, but this action cannot be
          undone from the UI.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteEmployee.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteEmployee.isPending}>
            {deleteEmployee.isPending ? 'Deleting…' : 'Delete employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
