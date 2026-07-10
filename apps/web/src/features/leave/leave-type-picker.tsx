'use client';

import { useLeaveTypes } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LeaveTypePicker({
  tenantId,
  value,
  onChange,
  disabled,
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { data: leaveTypes, isLoading } = useLeaveTypes(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a leave type'} />
      </SelectTrigger>
      <SelectContent>
        {leaveTypes?.map((leaveType) => (
          <SelectItem key={leaveType.id} value={leaveType.id}>
            {leaveType.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
