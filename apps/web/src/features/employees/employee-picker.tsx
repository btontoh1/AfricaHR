'use client';

import { useEmployees } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function EmployeePicker({
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
  const { data: employees, isLoading } = useEmployees(tenantId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select an employee'} />
      </SelectTrigger>
      <SelectContent>
        {employees?.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.firstName} {employee.lastName} ({employee.employeeNumber})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
