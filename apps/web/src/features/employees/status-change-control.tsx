'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateEmploymentStatus } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Employee, EmploymentStatus } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_STATUSES: EmploymentStatus[] = [
  'PENDING_ONBOARDING',
  'ACTIVE',
  'ON_LEAVE',
  'SUSPENDED',
  'TERMINATED',
];

export function StatusChangeControl({ tenantId, employee }: { tenantId: string; employee: Employee }) {
  const [nextStatus, setNextStatus] = useState<EmploymentStatus | ''>('');
  const [terminationDate, setTerminationDate] = useState('');
  const updateStatus = useUpdateEmploymentStatus(tenantId, employee.id);

  const otherStatuses = ALL_STATUSES.filter((status) => status !== employee.employmentStatus);

  async function handleApply() {
    if (!nextStatus) {
      return;
    }
    try {
      await updateStatus.mutateAsync({
        status: nextStatus,
        terminationDate:
          nextStatus === 'TERMINATED' && terminationDate ? terminationDate : undefined,
      });
      toast.success(`Status changed to ${nextStatus.replace('_', ' ').toLowerCase()}`);
      setNextStatus('');
      setTerminationDate('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to change status'));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label>Change status to</Label>
        <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as EmploymentStatus)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            {otherStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {nextStatus === 'TERMINATED' && (
        <div className="grid gap-1.5">
          <Label>Termination date</Label>
          <Input
            type="date"
            className="w-56"
            value={terminationDate}
            onChange={(event) => setTerminationDate(event.target.value)}
          />
        </div>
      )}
      <Button onClick={handleApply} disabled={!nextStatus || updateStatus.isPending}>
        {updateStatus.isPending ? 'Applying…' : 'Apply'}
      </Button>
    </div>
  );
}
