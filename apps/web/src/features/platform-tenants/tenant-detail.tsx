'use client';

import { toast } from 'sonner';
import { useTenant, useUpdateTenantStatus } from './queries';
import { TenantStatusBadge } from './tenant-status-badge';
import { allowedNextStatuses, TENANT_STATUS_LABEL } from './tenant-status';
import { AddTenantUserDialog } from './add-tenant-user-dialog';
import type { TenantStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

const DESTRUCTIVE_STATUSES: TenantStatus[] = ['SUSPENDED', 'CLOSED'];

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const { data: tenant, isLoading, isError, error } = useTenant(tenantId);
  const updateStatus = useUpdateTenantStatus(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !tenant) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load tenant')} />;
  }

  async function handleStatusChange(status: TenantStatus) {
    try {
      await updateStatus.mutateAsync(status);
      toast.success(`Tenant marked ${TENANT_STATUS_LABEL[status].toLowerCase()}`);
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, 'Failed to update tenant status'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        description={`Sign-in slug: ${tenant.slug}`}
        action={<TenantStatusBadge status={tenant.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Country" value={tenant.country} />
          <Field label="Currency" value={tenant.currency} />
          <Field label="Timezone" value={tenant.timezone} />
          <Field label="Created" value={tenant.createdAt.slice(0, 10)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {allowedNextStatuses(tenant.status).length === 0 ? (
            <p className="text-sm text-muted-foreground">This tenant is closed — no further status changes.</p>
          ) : (
            allowedNextStatuses(tenant.status).map((status) => (
              <Button
                key={status}
                variant={DESTRUCTIVE_STATUSES.includes(status) ? 'destructive' : 'default'}
                size="sm"
                disabled={updateStatus.isPending}
                onClick={() => handleStatusChange(status)}
              >
                Mark {TENANT_STATUS_LABEL[status].toLowerCase()}
              </Button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Users</CardTitle>
          <AddTenantUserDialog tenantId={tenantId} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add an admin or other user to this tenant. To see everyone already on this tenant, sign in as one of its
            admins and check Team Members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
