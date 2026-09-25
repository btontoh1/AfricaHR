'use client';

import { HandCoins } from 'lucide-react';
import { useVendorPayments } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  MOBILE_MONEY: 'Mobile money',
  CARD: 'Card',
  OTHER: 'Other',
};

export function VendorPaymentsList({ tenantId, vendorId }: { tenantId: string; vendorId?: string }) {
  const { data: payments, isLoading, isError, error } = useVendorPayments(tenantId, undefined, vendorId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load vendor payments')} />;
  }

  if (!payments || payments.length === 0) {
    return (
      <EmptyState icon={HandCoins} title="No payments recorded yet" description="Record one above once you have an open bill." />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Bills</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.paymentDate.slice(0, 10)}</TableCell>
              <TableCell className="font-medium">{payment.vendorName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{METHOD_LABEL[payment.method] ?? payment.method}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{payment.reference ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {payment.allocations.map((allocation) => allocation.billNumber).join(', ')}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(payment.amount, payment.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
