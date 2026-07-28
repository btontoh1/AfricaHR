'use client';

import { useState } from 'react';
import { useHeadcountReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { useAllOrganizationUnits, useOrganizations } from '@/features/organizations/queries';
import { StatCard } from './stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { TableCard } from '@/components/table-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function HeadcountReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: report, isLoading, isError, error } = useHeadcountReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from: from || undefined,
    to: to || undefined,
  });

  // The report groups by raw organizationUnitId - resolve those to names
  // here rather than showing UUIDs in the table.
  const { data: organizations } = useOrganizations(tenantId);
  const { data: organizationUnits } = useAllOrganizationUnits(
    tenantId,
    organizations?.map((org) => org.id) ?? [],
  );
  const unitName = (id: string) => organizationUnits?.find((unit) => unit.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="headcount-from">From (optional)</Label>
          <Input id="headcount-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="headcount-to">To (optional)</Label>
          <Input id="headcount-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the headcount report')} />}

      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Active employees" value={report.activeCount} />
            {report.hiresInPeriod !== undefined && (
              <StatCard label="Hires in period" value={report.hiresInPeriod} />
            )}
            {report.terminationsInPeriod !== undefined && (
              <StatCard label="Terminations in period" value={report.terminationsInPeriod} />
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">By employment type</h2>
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byEmploymentType.map((row) => (
                    <TableRow key={row.employmentType}>
                      <TableCell>{row.employmentType.replace('_', ' ')}</TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">By organization unit</h2>
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.byOrganizationUnit.map((row) => (
                    <TableRow key={row.organizationUnitId ?? 'none'}>
                      <TableCell>
                        {row.organizationUnitId ? unitName(row.organizationUnitId) : 'No unit'}
                      </TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </div>
        </div>
      )}
    </div>
  );
}
