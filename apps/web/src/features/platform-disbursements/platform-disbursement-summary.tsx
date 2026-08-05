'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { useDisbursementsNeedingAttention } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { StatCard } from '@/features/reporting/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Severity = 'STALE' | 'CRITICAL' | 'FAILED';

const SEVERITY_BADGE: Record<Severity, { label: string; variant: 'warning' | 'destructive' }> = {
  STALE: { label: 'Stale', variant: 'warning' },
  CRITICAL: { label: 'Critical', variant: 'destructive' },
  FAILED: { label: 'Failed', variant: 'destructive' },
};

function formatDuration(since: string): string {
  const ms = Date.now() - new Date(since).getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PlatformDisbursementSummary() {
  const { data: summary, isLoading, isError, error } = useDisbursementsNeedingAttention();

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
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load disbursement status')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Stale transfers" value={summary.counts.stale} icon={Clock} />
        <StatCard label="Critically stale transfers" value={summary.counts.critical} icon={AlertTriangle} />
        <StatCard label="Failed transfers" value={summary.counts.failed} icon={XCircle} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disbursements needing attention</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every payslip transfer is resolved.</p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Pay period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stuck for</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/platform-admin/tenants/${item.tenantId}`}
                          className="font-medium hover:underline"
                        >
                          {item.tenantName ?? item.tenantId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.employeeFirstName} {item.employeeLastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.periodStart.slice(0, 10)} – {item.periodEnd.slice(0, 10)}
                      </TableCell>
                      <TableCell>{formatCurrency(item.netPay, item.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={SEVERITY_BADGE[item.severity].variant}>
                          {SEVERITY_BADGE[item.severity].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDuration(item.updatedAt)}</TableCell>
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
