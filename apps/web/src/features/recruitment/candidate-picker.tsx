'use client';

import { useCandidates } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CandidatePicker({
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
  const { data: candidates, isLoading } = useCandidates(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a candidate'} />
      </SelectTrigger>
      <SelectContent>
        {candidates?.map((candidate) => (
          <SelectItem key={candidate.id} value={candidate.id}>
            {candidate.firstName} {candidate.lastName} ({candidate.email})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
