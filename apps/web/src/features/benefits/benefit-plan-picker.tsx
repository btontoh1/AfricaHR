'use client';

import { useBenefitPlans } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function BenefitPlanPicker({
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
  const { data: plans, isLoading } = useBenefitPlans(tenantId, true);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a benefit plan'} />
      </SelectTrigger>
      <SelectContent>
        {plans?.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            {plan.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
