'use client';

import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { useTenants } from './queries';
import { TenantStatusBadge } from './tenant-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TenantsList() {
  const { data: tenants, isLoading, isError, error } = useTenants();

  return (
    <div>
      <PageHeader
        title="Tenants"
        description={tenants ? `${tenants.length} tenant${tenants.length === 1 ? '' : 's'}` : undefined}
        action={
          <Button asChild>
            <Link href="/platform-admin/tenants/new">
              <Plus className="size-4" />
              Add tenant
            </Link>
          </Button>
        }
      />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load tenants')} />}

      {tenants && tenants.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No tenants yet"
          description="Add the first tenant to get started."
          action={
            <Button asChild size="sm">
              <Link href="/platform-admin/tenants/new">
                <Plus className="size-4" />
                Add tenant
              </Link>
            </Button>
          }
        />
      )}

      {tenants && tenants.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link href={`/platform-admin/tenants/${tenant.id}`} className="font-medium hover:underline">
                      {tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                  <TableCell>
                    <TenantStatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tenant.country}</TableCell>
                  <TableCell className="text-muted-foreground">{tenant.currency}</TableCell>
                  <TableCell className="text-muted-foreground">{tenant.createdAt.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
