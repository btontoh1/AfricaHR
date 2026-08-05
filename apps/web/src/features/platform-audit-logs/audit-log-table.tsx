'use client';

import { useState } from 'react';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuditLogs } from './queries';
import { useTenants } from '@/features/platform-tenants/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL_TENANTS = 'ALL';
const PAGE_SIZE = 50;

function actorLabel(entry: {
  actorEmail?: string | null;
  actorFirstName?: string | null;
  actorLastName?: string | null;
}) {
  if (!entry.actorEmail) return 'System';
  const name = [entry.actorFirstName, entry.actorLastName].filter(Boolean).join(' ');
  return name ? `${name} (${entry.actorEmail})` : entry.actorEmail;
}

export function AuditLogTable() {
  const { data: tenants } = useTenants();
  const [tenantId, setTenantId] = useState(ALL_TENANTS);
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [offset, setOffset] = useState(0);

  function resetPageAnd<T>(setter: (value: T) => void) {
    return (value: T) => {
      setOffset(0);
      setter(value);
    };
  }

  const { data, isLoading, isError, error } = useAuditLogs({
    tenantId: tenantId === ALL_TENANTS ? undefined : tenantId,
    action: action || undefined,
    resourceType: resourceType || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const totalCount = data?.totalCount ?? 0;
  const items = data?.items ?? [];
  const hasNextPage = offset + PAGE_SIZE < totalCount;
  const hasPrevPage = offset > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={
          totalCount > 0
            ? `${totalCount} entr${totalCount === 1 ? 'y' : 'ies'} matching the current filters`
            : undefined
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="audit-tenant">Tenant</Label>
          <Select value={tenantId} onValueChange={resetPageAnd(setTenantId)}>
            <SelectTrigger id="audit-tenant" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TENANTS}>All tenants</SelectItem>
              {tenants?.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="audit-action">Action</Label>
          <Input
            id="audit-action"
            placeholder="e.g. role_changed"
            className="w-48"
            value={action}
            onChange={(e) => resetPageAnd(setAction)(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="audit-resource-type">Resource type</Label>
          <Input
            id="audit-resource-type"
            placeholder="e.g. User"
            className="w-40"
            value={resourceType}
            onChange={(e) => resetPageAnd(setResourceType)(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="audit-from">From</Label>
          <Input id="audit-from" type="date" value={from} onChange={(e) => resetPageAnd(setFrom)(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="audit-to">To</Label>
          <Input id="audit-to" type="date" value={to} onChange={(e) => resetPageAnd(setTo)(e.target.value)} />
        </div>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the audit log')} />}

      {data && items.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title="No matching audit entries"
          description="Try widening the filters above."
        />
      )}

      {data && items.length > 0 && (
        <div className="space-y-3">
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.tenantName ?? 'Platform'}</TableCell>
                    <TableCell>{actorLabel(entry)}</TableCell>
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.resourceType}
                      {entry.resourceId ? ` (${entry.resourceId})` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevPage}
                onClick={() => setOffset((prev) => Math.max(prev - PAGE_SIZE, 0))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
