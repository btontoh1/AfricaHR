'use client';

import { useUsers } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

export function UserPicker({
  value,
  onChange,
  disabled,
  allowClear,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Shows a "No portal access" option that maps to an empty string, for optional links like Employee.userId. */
  allowClear?: boolean;
}) {
  const { data: users, isLoading } = useUsers();

  return (
    <Select
      value={allowClear ? value || NONE_VALUE : value}
      onValueChange={(next) => onChange(allowClear && next === NONE_VALUE ? '' : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a user'} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && <SelectItem value={NONE_VALUE}>No portal access</SelectItem>}
        {users?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.firstName} {user.lastName} ({user.email})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
