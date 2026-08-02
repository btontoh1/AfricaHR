'use client';

import Link from 'next/link';
import { TrendingUp, Wallet, AlarmClock } from 'lucide-react';
import { usePlatformBillingSummary } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { StatCard } from '@/features/reporting/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Money is grouped per currency, never blended into one number (see
// summarizeMonthlyRecurringRevenue in billing-domain) - a single-currency
// platform shows one line, a multi-currency one shows each rather than a
// financially meaningless sum.
function formatByCurrency(entries: { currency: string; amount: number }[] | undefined): string {
  if (!entries || entries.length === 0) {
    return '—';
  }
  return entries.map((entry) => formatCurrency(entry.amount, entry.currency)).join(' + ');
}

export function PlatformBillingSummary() {
  const { data: summary, isLoading, isError, error } = usePlatformBillingSummary();

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
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load billing summary')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Monthly recurring revenue" value={formatByCurrency(summary.mrr)} icon={TrendingUp} />
        <StatCard label="Platform revenue (all-time)" value={formatByCurrency(summary.platformRevenue)} icon={Wallet} />
        <StatCard label="Expiring subscriptions" value={summary.expiringSubscriptions.length} icon={AlarmClock} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expiring subscriptions (next 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.expiringSubscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscriptions expiring soon.</p>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Renews</TableHead>
                    <TableHead>Amount due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.expiringSubscriptions.map((entry) => (
                    <TableRow key={entry.tenantId}>
                      <TableCell>
                        <Link href={`/platform-admin/tenants/${entry.tenantId}`} className="font-medium hover:underline">
                          {entry.tenantName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.currentPeriodEnd.slice(0, 10)}</TableCell>
                      <TableCell>{formatCurrency(entry.amountDue, entry.currency)}</TableCell>
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
