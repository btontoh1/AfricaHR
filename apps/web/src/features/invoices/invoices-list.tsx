'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { useInvoices } from './queries';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { useOrganizations } from '@/features/organizations/queries';
import { useSession } from '@/app/(app)/session-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InvoicesList({ tenantId }: { tenantId: string }) {
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const { data: invoices, isLoading, isError, error } = useInvoices(tenantId);
  // Same rationale as CustomersList: an ORG_ADMIN's list is already scoped
  // to their one organization, so resolving organizationId -> name is only
  // useful (and only permitted) for tenant-wide roles.
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load invoices')} />;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <EmptyState icon={FileText} title="No invoices yet" description="Create your first invoice above." />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            {!isOrgAdmin && <TableHead>Organization</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{invoice.customerName}</TableCell>
              {!isOrgAdmin && (
                <TableCell className="text-muted-foreground">{organizationName(invoice.organizationId)}</TableCell>
              )}
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{invoice.dueDate.slice(0, 10)}</TableCell>
              <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
