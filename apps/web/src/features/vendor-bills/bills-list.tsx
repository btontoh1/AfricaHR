'use client';

import Link from 'next/link';
import { FileMinus2 } from 'lucide-react';
import { useVendorBills } from './queries';
import { BillStatusBadge } from './bill-status-badge';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function BillsList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: bills, isLoading, isError, error } = useVendorBills(tenantId);
  // Same rationale as VendorsList: an ORG_ADMIN's list is already scoped to
  // their one organization, so resolving organizationId -> name is only
  // useful (and only permitted) for tenant-wide roles.
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load bills')} />;
  }

  if (!bills || bills.length === 0) {
    return <EmptyState icon={FileMinus2} title="No bills yet" description="Create your first bill above." />;
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill #</TableHead>
            <TableHead>Vendor</TableHead>
            {!isOrgAdmin && <TableHead>Organization</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Balance due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell className="font-medium">
                <Link href={`/vendor-bills/${bill.id}`} className="hover:underline">
                  {bill.billNumber}
                </Link>
              </TableCell>
              <TableCell>{bill.vendorName}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">{organizationName(bill.organizationId)}</TableCell>
              )}
              <TableCell>
                <BillStatusBadge status={bill.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{bill.dueDate.slice(0, 10)}</TableCell>
              <TableCell>{formatCurrency(bill.total, bill.currency)}</TableCell>
              <TableCell className="text-muted-foreground">{formatCurrency(bill.balanceDue, bill.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
