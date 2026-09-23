'use client';

import { ScrollText } from 'lucide-react';
import { useJournalEntries } from './queries';
import { useOrganizations } from '@/features/organizations/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SOURCE_TYPE_LABELS: Record<string, string> = {
  PAY_RUN_DISBURSED: 'Payroll',
  CUSTOMER_INVOICE_SENT: 'Invoice sent',
  CUSTOMER_INVOICE_PAID: 'Invoice paid',
  MANUAL: 'Manual',
};

export function JournalEntriesList({ tenantId }: { tenantId: string }) {
  const { data: entries, isLoading, isError, error } = useJournalEntries(tenantId);
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (organizationId: string) =>
    organizations?.find((organization) => organization.id === organizationId)?.legalName ?? organizationId;

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load journal entries')} />;
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No journal entries yet"
        description="Entries post automatically from payroll and invoicing, or create one manually above."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Lines</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground">{entry.entryDate.slice(0, 10)}</TableCell>
              <TableCell className="font-medium">{entry.description}</TableCell>
              <TableCell className="text-muted-foreground">{organizationName(entry.organizationId)}</TableCell>
              <TableCell>
                <Badge variant="outline">{SOURCE_TYPE_LABELS[entry.sourceType] ?? entry.sourceType}</Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5 text-xs">
                  {entry.lines.map((line, index) => (
                    <div key={index} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {line.accountCode} — {line.accountName}
                      </span>
                      <span>
                        {Number(line.debit) > 0
                          ? `Dr ${formatCurrency(line.debit, entry.currency)}`
                          : `Cr ${formatCurrency(line.credit, entry.currency)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
