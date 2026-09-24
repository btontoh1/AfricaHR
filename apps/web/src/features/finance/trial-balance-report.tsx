'use client';

import { useState } from 'react';
import { Rows3 } from 'lucide-react';
import { getTrialBalancePdfUrl, useTrialBalanceReport } from './queries';
import { ReportPdfButtons } from './report-pdf-buttons';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TrialBalanceReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [asOf, setAsOf] = useState(today());

  const { data: report, isLoading, isError, error } = useTrialBalanceReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    asOf,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="trial-balance-as-of">As of</Label>
          <Input
            id="trial-balance-as-of"
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Every account with any activity as of the date above, netted to whichever side (debit or credit)
        it balances on. Total debit and total credit always match - that&apos;s what a trial balance
        proves.
      </p>

      <ReportPdfButtons
        organizationSelected={organizationId !== ALL_ORGANIZATIONS}
        viewUrl={getTrialBalancePdfUrl(tenantId, { organizationId, asOf }, false)}
        downloadUrl={getTrialBalancePdfUrl(tenantId, { organizationId, asOf }, true)}
      />

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the trial balance')} />}

      {report && report.byCurrency.length === 0 && (
        <EmptyState icon={Rows3} title="No activity posted as of this date" />
      )}

      {report && report.byCurrency.length > 0 && (
        <div className="space-y-6">
          {/* One table per currency, never blended - same reasoning as every other finance report. */}
          {report.byCurrency.map((byCurrency) => (
            <div key={byCurrency.currency} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{byCurrency.currency}</h3>
              <TableCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byCurrency.accounts.map((account) => (
                      <TableRow key={account.accountCode}>
                        <TableCell>
                          <span className="font-mono text-muted-foreground">{account.accountCode}</span>{' '}
                          {account.accountName}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.debit > 0 ? formatCurrency(account.debit, byCurrency.currency) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.credit > 0 ? formatCurrency(account.credit, byCurrency.currency) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(byCurrency.totalDebit, byCurrency.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(byCurrency.totalCredit, byCurrency.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
