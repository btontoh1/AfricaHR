'use client';

import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSetUserActive, useUpdateUserRole, useUsers } from './queries';
import { ASSIGNABLE_ROLE_OPTIONS } from './team-members-form-schema';
import type { SystemRole } from './types';
import { EditUserProfileDialog } from './edit-user-profile-dialog';
import { ResetUserPasswordDialog } from './reset-user-password-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
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
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load team members')} />;
  }

  if (!users || users.length === 0) {
    return <EmptyState icon={Users} title="No team members yet" />;
  }

  return (
    <TableCard>
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
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                {canManage ? (
                  <RoleControl id={user.id} role={user.role} />
                ) : (
                  user.role.replace('_', ' ')
                )}
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'success' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <EditUserProfileDialog user={user} />
                    <ResetUserPasswordDialog user={user} />
                    {user.role !== 'PLATFORM_ADMIN' && <ActiveControl id={user.id} isActive={user.isActive} />}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
