'use client';

import { useState } from 'react';
import { useHeadcountReport } from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { StatCard } from './stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

      {isLoading && <Skeleton className="h-32 w-full" />}

      {isError && (
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, 'Failed to load the headcount report')}
        </p>
      )}

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
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">By organization unit</h2>
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
                    <TableCell>{row.organizationUnitId ?? 'No unit'}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
