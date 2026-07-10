'use client';

import { useReviewCycles } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ReviewCyclePicker({
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
  const { data: cycles, isLoading } = useReviewCycles(tenantId);
  const openCycles = cycles?.filter((cycle) => cycle.status !== 'CLOSED');

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a review cycle'} />
      </SelectTrigger>
      <SelectContent>
        {openCycles?.map((cycle) => (
          <SelectItem key={cycle.id} value={cycle.id}>
            {cycle.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
