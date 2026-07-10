'use client';

import { useRequisitions } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function RequisitionPicker({
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
  const { data: requisitions, isLoading } = useRequisitions(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a requisition'} />
      </SelectTrigger>
      <SelectContent>
        {requisitions?.map((requisition) => (
          <SelectItem key={requisition.id} value={requisition.id}>
            {requisition.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
