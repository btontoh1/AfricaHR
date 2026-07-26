'use client';

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { useMyPayslips } from './queries';
import { PayslipStatusBadge } from './payslip-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function MyPayslipsTable({ tenantId }: { tenantId: string }) {
  const { data: payslips, isLoading, isError, error } = useMyPayslips(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load payslips')} />;
  }

  if (!payslips || payslips.length === 0) {
    return <EmptyState icon={Receipt} title="No payslips yet" description="Payslips appear here once a pay run including you has been processed." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Gross pay</TableHead>
            <TableHead>PAYE tax</TableHead>
            <TableHead>SSNIT</TableHead>
            <TableHead>Net pay</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.map((payslip) => (
            <TableRow key={payslip.id}>
              <TableCell>
                <PayslipStatusBadge status={payslip.status} />
              </TableCell>
              <TableCell>{payslip.grossPay}</TableCell>
              <TableCell>{payslip.payeTax}</TableCell>
              <TableCell>{payslip.ssnitEmployee}</TableCell>
              <TableCell className="font-medium">{payslip.netPay}</TableCell>
              <TableCell>{payslip.currency}</TableCell>
              <TableCell>
                <Link href={`/payslips/${payslip.id}`} className="text-sm text-primary hover:underline">
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
