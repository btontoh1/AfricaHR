'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { useJournalEntries } from './queries';
import { VoidJournalEntryDialog } from './void-journal-entry-dialog';
import { useOrganizations } from '@/features/organizations/queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
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
  RECURRING_JOURNAL_ENTRY: 'Recurring',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function JournalEntriesList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filterOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: entries, isLoading, isError, error } = useJournalEntries(tenantId, filterOrganizationId);
  const { data: organizations } = useOrganizations(tenantId);
  const organizationName = (id: string) =>
    organizations?.find((organization) => organization.id === id)?.legalName ?? id;

  return (
    <div className="space-y-4">
      <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load journal entries')} />}

      {entries && entries.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title={filterOrganizationId ? 'No journal entries for this organization' : 'No journal entries yet'}
          description="Entries post automatically from payroll and invoicing, or create one manually above."
        />
      )}

      {entries && entries.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const canVoid = entry.sourceType === 'MANUAL' && !entry.voidedAt && !entry.reversalOfId;
                const isExpanded = expandedId === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <TableRow>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{entry.entryDate.slice(0, 10)}</TableCell>
                      <TableCell className={cn('font-medium', entry.voidedAt && 'line-through opacity-60')}>
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{organizationName(entry.organizationId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">{SOURCE_TYPE_LABELS[entry.sourceType] ?? entry.sourceType}</Badge>
                          {entry.reversalOfId && <Badge variant="secondary">Reversal</Badge>}
                          {entry.voidedAt && <Badge variant="warning">Voided</Badge>}
                        </div>
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
                      <TableCell className="text-right">
                        {canVoid && <VoidJournalEntryDialog tenantId={tenantId} entryId={entry.id} />}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7}>
                          <div className="grid gap-4 py-1 sm:grid-cols-3">
                            <Field label="Prepared by" value={entry.preparedByName} />
                            <Field label="Created" value={new Date(entry.createdAt).toLocaleString()} />
                            <Field label="Department" value={entry.organizationUnitName} />
                            <Field label="Approved by" value={entry.approvedByName} />
                            <Field
                              label="Approved"
                              value={entry.approvedAt ? new Date(entry.approvedAt).toLocaleString() : undefined}
                            />
                            <Field label="Cost center" value={entry.costCenterName} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
