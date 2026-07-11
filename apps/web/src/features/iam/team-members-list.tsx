'use client';

import { toast } from 'sonner';
import { useSetUserActive, useUpdateUserRole, useUsers } from './queries';
import { ASSIGNABLE_ROLE_OPTIONS } from './team-members-form-schema';
import type { SystemRole } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function RoleControl({ id, role }: { id: string; role: SystemRole }) {
  const updateRole = useUpdateUserRole(id);

  async function handleChange(next: string) {
    try {
      await updateRole.mutateAsync(next as SystemRole);
      toast.success('Role updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update role'));
    }
  }

  // PLATFORM_ADMIN is excluded from the option list (see
  // team-members-form-schema.ts) but a platform-admin-created user could
  // still be viewed here, so render it as a fixed label rather than a
  // selectable option that would 400 if resubmitted unchanged.
  if (role === 'PLATFORM_ADMIN') {
    return <span className="text-sm">PLATFORM ADMIN</span>;
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={updateRole.isPending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {option.replace('_', ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActiveControl({ id, isActive }: { id: string; isActive: boolean }) {
  const setActive = useSetUserActive(id);

  async function handleToggle() {
    try {
      await setActive.mutateAsync(!isActive);
      toast.success(isActive ? 'Account deactivated' : 'Account activated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update account status'));
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={setActive.isPending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}

export function TeamMembersList({ canManage }: { canManage: boolean }) {
  const { data: users, isLoading, isError, error } = useUsers();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {getApiErrorMessage(error, 'Failed to load team members')}
      </p>
    );
  }

  if (!users || users.length === 0) {
    return <p className="text-sm text-muted-foreground">No team members yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              {user.firstName} {user.lastName}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {canManage ? (
                <RoleControl id={user.id} role={user.role} />
              ) : (
                user.role.replace('_', ' ')
              )}
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              {canManage && user.role !== 'PLATFORM_ADMIN' && (
                <ActiveControl id={user.id} isActive={user.isActive} />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
