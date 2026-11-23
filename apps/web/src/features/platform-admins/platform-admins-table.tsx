'use client';

import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useUpdatePlatformAdminActive } from './queries';
import type { PlatformAdmin } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PlatformAdminsTable({ admins }: { admins: PlatformAdmin[] }) {
  const session = useSession();
  const updateActive = useUpdatePlatformAdminActive();

  async function handleActiveToggle(admin: PlatformAdmin) {
    try {
      await updateActive.mutateAsync({ id: admin.id, isActive: !admin.isActive });
      toast.success(admin.isActive ? 'Platform admin deactivated' : 'Platform admin activated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update platform admin'));
    }
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => {
            const isSelf = admin.id === session.sub;
            return (
              <TableRow key={admin.id}>
                <TableCell>
                  {admin.firstName} {admin.lastName}
                  {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                <TableCell>
                  <Badge variant={admin.isActive ? 'success' : 'outline'}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSelf && admin.isActive}
                    title={isSelf && admin.isActive ? "You can't deactivate your own account" : undefined}
                    onClick={() => handleActiveToggle(admin)}
                  >
                    {admin.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}
