'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdjustLeaveBalance, useLeaveTypes } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function AdjustLeaveBalanceControl({
  tenantId,
  employeeId,
}: {
  tenantId: string;
  employeeId: string;
}) {
  const { data: leaveTypes } = useLeaveTypes(tenantId);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [entitledDays, setEntitledDays] = useState('');
  const [usedDays, setUsedDays] = useState('');
  const adjustBalance = useAdjustLeaveBalance(tenantId);

  async function handleApply() {
    if (!leaveTypeId || !year) {
      return;
    }
    try {
      const result = await adjustBalance.mutateAsync({
        employeeId,
        leaveTypeId,
        year: Number(year),
        entitledDays: entitledDays === '' ? undefined : Number(entitledDays),
        usedDays: usedDays === '' ? undefined : Number(usedDays),
      });
      toast.success(
        `${result.leaveTypeName} balance updated: ${result.entitledDays} entitled, ${result.usedDays} used, ${result.remainingDays} remaining`,
      );
      setEntitledDays('');
      setUsedDays('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to adjust leave balance'));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid gap-1.5">
        <Label>Leave type</Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes?.map((leaveType) => (
              <SelectItem key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Year</Label>
        <Input
          type="number"
          className="w-24"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Entitled days</Label>
        <Input
          type="number"
          min={0}
          className="w-28"
          placeholder="Unchanged"
          value={entitledDays}
          onChange={(event) => setEntitledDays(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Used days</Label>
        <Input
          type="number"
          min={0}
          className="w-28"
          placeholder="Unchanged"
          value={usedDays}
          onChange={(event) => setUsedDays(event.target.value)}
        />
      </div>
      <Button onClick={handleApply} disabled={!leaveTypeId || !year || adjustBalance.isPending}>
        {adjustBalance.isPending ? 'Applying…' : 'Apply'}
      </Button>
    </div>
  );
}
