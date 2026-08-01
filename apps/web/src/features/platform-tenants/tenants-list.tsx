'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Search } from 'lucide-react';
import { useTenants } from './queries';
import { TenantStatusBadge } from './tenant-status-badge';
import { TENANT_STATUS_LABEL } from './tenant-status';
import type { Tenant, TenantStatus } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/features/reporting/stat-card';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_ORDER: TenantStatus[] = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CLOSED'];

function countByStatus(tenants: Tenant[]): Record<TenantStatus, number> {
  const counts: Record<TenantStatus, number> = { TRIAL: 0, ACTIVE: 0, SUSPENDED: 0, CLOSED: 0 };
  for (const tenant of tenants) {
    counts[tenant.status] += 1;
  }
  return counts;
}

export function TenantsList() {
  const { data: tenants, isLoading, isError, error } = useTenants();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!tenants) return tenants;
    const term = search.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter(
      (tenant) => tenant.name.toLowerCase().includes(term) || tenant.slug.toLowerCase().includes(term),
    );
  }, [tenants, search]);

  const counts = useMemo(() => (tenants ? countByStatus(tenants) : null), [tenants]);

  return (
    <div className="space-y-6">
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

      {counts && tenants && tenants.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <StatCard key={status} label={TENANT_STATUS_LABEL[status]} value={counts[status]} />
          ))}
        </div>
      )}

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
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered && filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching tenants" description="Try a different search term." />
          ) : (
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
                  {filtered?.map((tenant) => (
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
      )}
    </div>
  );
}
