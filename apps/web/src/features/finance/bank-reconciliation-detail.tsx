'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Printer, Trash2 } from 'lucide-react';
import {
  useBankReconciliationDetail,
  useCompleteBankReconciliation,
  useDeleteBankReconciliation,
  useToggleReconciliationLine,
} from './queries';
import { BankReconciliationStatusBadge } from './bank-reconciliation-status-badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';
import { TableCard } from '@/components/table-card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? '—'}</div>
    </div>
  );
}

export function BankReconciliationDetail({ tenantId, reconciliationId }: { tenantId: string; reconciliationId: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: reconciliation, isLoading, isError, error } = useBankReconciliationDetail(tenantId, reconciliationId);
  const toggleLine = useToggleReconciliationLine(tenantId, reconciliationId);
  const completeReconciliation = useCompleteBankReconciliation(tenantId, reconciliationId);
  const deleteReconciliation = useDeleteBankReconciliation(tenantId);

  async function handleToggle(lineId: string) {
    try {
      await toggleLine.mutateAsync(lineId);
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update line'));
    }
  }

  async function handleComplete() {
    try {
      await completeReconciliation.mutateAsync();
      toast.success('Reconciliation completed');
    } catch (completeError) {
      toast.error(getApiErrorMessage(completeError, 'Failed to complete reconciliation'));
    }
  }

  async function handleDelete() {
    try {
      await deleteReconciliation.mutateAsync(reconciliationId);
      toast.success('Reconciliation deleted');
      router.push('/finance/bank-reconciliations');
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'Failed to delete reconciliation'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !reconciliation) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load reconciliation')} />;
  }

  const isInProgress = reconciliation.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Reconciliation — ${reconciliation.statementDate.slice(0, 10)}`}
        description={reconciliation.currency}
        backHref="/finance/bank-reconciliations"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()} className="print:hidden">
              <Printer className="size-4" />
              Print / Save as PDF
            </Button>
            {isInProgress && (
              <div className="flex flex-wrap gap-2 print:hidden">
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete this reconciliation?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Every line cleared in this reconciliation is released back to unclaimed.
                    </p>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteOpen(false)}
                        disabled={deleteReconciliation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={deleteReconciliation.isPending}>
                        {deleteReconciliation.isPending ? 'Deleting…' : 'Delete'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleComplete} disabled={!reconciliation.isBalanced || completeReconciliation.isPending}>
                  {completeReconciliation.isPending ? 'Completing…' : 'Complete reconciliation'}
                </Button>
              </div>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Field label="Status" value={<BankReconciliationStatusBadge status={reconciliation.status} />} />
          <Field label="Statement date" value={reconciliation.statementDate.slice(0, 10)} />
          <Field
            label="Statement ending balance"
            value={formatCurrency(reconciliation.statementEndingBalance, reconciliation.currency)}
          />
          <Field
            label="Cleared balance"
            value={formatCurrency(reconciliation.clearedBalance, reconciliation.currency)}
          />
          <Field
            label="Difference"
            value={
              <span className={reconciliation.isBalanced ? 'text-success' : 'text-destructive'}>
                {formatCurrency(reconciliation.difference, reconciliation.currency)}
              </span>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash and Bank lines</CardTitle>
        </CardHeader>
        <CardContent>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliation.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Checkbox
                        checked={line.cleared}
                        disabled={!isInProgress || toggleLine.isPending}
                        onCheckedChange={() => handleToggle(line.id)}
                      />
                    </TableCell>
                    <TableCell>{line.entryDate.slice(0, 10)}</TableCell>
                    <TableCell className="text-muted-foreground">{line.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.debit, reconciliation.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.credit, reconciliation.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </CardContent>
      </Card>
    </div>
  );
}
