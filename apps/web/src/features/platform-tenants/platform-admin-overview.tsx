'use client';

import Link from 'next/link';
import { Building2, Database, HardDrive, Activity } from 'lucide-react';
import { usePlatformDashboard } from './queries';
import { TenantStatusBadge } from './tenant-status-badge';
import { PlatformBillingSummary } from '@/features/billing/platform-billing-summary';
import { PlatformDisbursementSummary } from '@/features/platform-disbursements/platform-disbursement-summary';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { StatCard } from '@/features/reporting/stat-card';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

function HealthBadge({ label, up }: { label: string; up: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant={up ? 'success' : 'destructive'}>{up ? 'Operational' : 'Down'}</Badge>
    </div>
  );
}

export function PlatformAdminOverview() {
  const { data: summary, isLoading, isError, error } = usePlatformDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !summary) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load platform dashboard')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total tenants" value={summary.totalTenants} icon={Building2} />
        <StatCard
          label="Database size"
          value={summary.databaseSizeBytes !== null && summary.databaseSizeBytes !== undefined ? formatBytes(summary.databaseSizeBytes) : '—'}
          icon={Database}
        />
        <StatCard
          label="Storage used"
          value={
            summary.storage
              ? `${formatBytes(summary.storage.usedBytes)} · ${summary.storage.objectCount} file${summary.storage.objectCount === 1 ? '' : 's'}`
              : '—'
          }
          icon={HardDrive}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-muted-foreground" />
            System health
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <HealthBadge label="API" up={summary.health.api} />
          <HealthBadge label="Database" up={summary.health.database} />
          <HealthBadge label="Redis" up={summary.health.redis} />
        </CardContent>
      </Card>

      <PlatformBillingSummary />

      <PlatformDisbursementSummary />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recentTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants yet.</p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.recentTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <Link href={`/platform-admin/tenants/${tenant.id}`} className="font-medium hover:underline">
                          {tenant.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TenantStatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tenant.createdAt.slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
