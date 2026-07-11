'use client';

import { useUsers } from './queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function UserPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { data: users, isLoading } = useUsers();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? 'Loading…' : 'Select a user'} />
      </SelectTrigger>
      <SelectContent>
        {users?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.firstName} {user.lastName} ({user.email})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
