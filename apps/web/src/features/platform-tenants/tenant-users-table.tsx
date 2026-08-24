'use client';

import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { useTenantUsers, useUpdateTenantUserActive, useUpdateTenantUserRole } from './queries';
import { EditTenantUserProfileDialog } from './edit-tenant-user-profile-dialog';
import { ResetTenantUserPasswordDialog } from './reset-tenant-user-password-dialog';
import type { SystemRole } from '@/features/iam/types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TableSkeleton } from '@/components/loading-state';
import { TableCard } from '@/components/table-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// A tenant-scoped list never includes PLATFORM_ADMIN (that role always has
// tenantId: null), so this is exhaustive for what this table will ever
// render - no "other" case to handle.
const ROLE_LABEL: Record<Exclude<SystemRole, 'PLATFORM_ADMIN'>, string> = {
  TENANT_ADMIN: 'Tenant Admin',
  HR_MANAGER: 'HR Manager',
  PAYROLL_MANAGER: 'Payroll Manager',
  PAYROLL_OFFICER: 'Payroll Officer',
  ORG_ADMIN: 'Org Admin',
  EMPLOYEE: 'Employee',
};

// ORG_ADMIN is excluded from the selectable set - this inline dropdown has
// nowhere to collect the organizationId it requires, same reasoning as
// team-members-list.tsx's RoleControl. An existing ORG_ADMIN row renders
// ROLE_LABEL as fixed text instead of this Select (see below).
const ASSIGNABLE_ROLES = (Object.keys(ROLE_LABEL) as (keyof typeof ROLE_LABEL)[]).filter(
  (role) => role !== 'ORG_ADMIN',
);

export function TenantUsersTable({ tenantId }: { tenantId: string }) {
  const { data: users, isLoading, isError, error } = useTenantUsers(tenantId);
  const updateRole = useUpdateTenantUserRole(tenantId);
  const updateActive = useUpdateTenantUserActive(tenantId);

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load users')} />;
  }

  if (!users || users.length === 0) {
    return <EmptyState icon={Users} title="No users yet" description="Add the first user with the button above." />;
  }

  async function handleRoleChange(id: string, role: SystemRole) {
    try {
      await updateRole.mutateAsync({ id, role });
      toast.success('Role updated');
    } catch (roleError) {
      toast.error(getApiErrorMessage(roleError, 'Failed to update role'));
    }
  }

  async function handleActiveToggle(id: string, isActive: boolean) {
    try {
      await updateActive.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? 'User deactivated' : 'User activated');
    } catch (activeError) {
      toast.error(getApiErrorMessage(activeError, 'Failed to update user'));
    }
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
              <TableCell>
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                {user.role === 'ORG_ADMIN' ? (
                  <span className="text-sm">{ROLE_LABEL.ORG_ADMIN}</span>
                ) : (
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as SystemRole)}
                  >
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'success' : 'outline'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EditTenantUserProfileDialog tenantId={tenantId} user={user} />
                  <ResetTenantUserPasswordDialog tenantId={tenantId} user={user} />
                  <Button variant="outline" size="sm" onClick={() => handleActiveToggle(user.id, user.isActive)}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
