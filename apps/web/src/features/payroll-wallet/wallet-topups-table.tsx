'use client';

import { ExternalLink, History } from 'lucide-react';
import { useWalletTopUps } from './queries';
import { WalletTopUpStatusBadge } from './wallet-topup-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { TableSkeleton } from '@/components/loading-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function WalletTopUpsTable({ tenantId }: { tenantId: string }) {
  const { data: topUps, isLoading, isError, error } = useWalletTopUps(tenantId);

  if (isLoading) {
    return <TableSkeleton rows={3} />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load top-up history')} />;
  }

  if (!topUps || topUps.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No top-ups yet"
        description="Requested top-ups and their Paystack checkout status will appear here."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requested</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {topUps.map((topUp) => (
            <TableRow key={topUp.id}>
              <TableCell className="text-muted-foreground">{topUp.createdAt.slice(0, 10)}</TableCell>
              <TableCell>{formatCurrency(topUp.amount, topUp.currency)}</TableCell>
              <TableCell>
                <WalletTopUpStatusBadge status={topUp.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{topUp.paidAt?.slice(0, 10) ?? '—'}</TableCell>
              <TableCell className="flex items-center justify-end">
                {topUp.checkoutUrl && topUp.status === 'PENDING' && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={topUp.checkoutUrl} target="_blank" rel="noreferrer">
                      Checkout <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
