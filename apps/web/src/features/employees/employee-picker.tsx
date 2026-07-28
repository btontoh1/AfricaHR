'use client';

import { useEmployees } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

export function EmployeePicker({
  tenantId,
  value,
  onChange,
  disabled,
  /** Shows a "No manager" option that maps to an empty string, for optional links like Employee.managerId. */
  allowClear,
  /** Omit this employee from the list — for the reporting-manager picker, so an employee can't be set as their own manager. */
  excludeEmployeeId,
}: {
  tenantId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
  excludeEmployeeId?: string;
}) {
  const { data: employees, isLoading } = useEmployees(tenantId);
  const options = employees?.filter((employee) => employee.id !== excludeEmployeeId);

  return (
    <Select
      value={allowClear ? value || NONE_VALUE : value}
      onValueChange={(next) => onChange(allowClear && next === NONE_VALUE ? '' : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select an employee'} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && <SelectItem value={NONE_VALUE}>No manager</SelectItem>}
        {options?.map((employee) => (
          <SelectItem key={employee.id} value={employee.id}>
            {employee.firstName} {employee.lastName} ({employee.employeeNumber})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
