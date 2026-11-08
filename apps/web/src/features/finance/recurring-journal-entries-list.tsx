'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Pause, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  useDeleteRecurringJournalEntry,
  useRecurringJournalEntries,
  useSetRecurringJournalEntryActive,
} from './queries';
import { OrganizationFilter, ALL_ORGANIZATIONS } from '@/features/reporting/organization-filter';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function DeleteRecurringJournalEntryDialog({ tenantId, id, description }: { tenantId: string; id: string; description: string }) {
  const [open, setOpen] = useState(false);
  const deleteTemplate = useDeleteRecurringJournalEntry(tenantId);

  async function handleDelete() {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Recurring journal entry deleted');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete recurring journal entry'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{description}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This only removes the template - it has no effect on any journal entries it has already posted.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteTemplate.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteTemplate.isPending}>
            {deleteTemplate.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringJournalEntriesList({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const scopedOrganizationId = organizationId === ALL_ORGANIZATIONS ? undefined : organizationId;
  const { data: templates, isLoading, isError, error } = useRecurringJournalEntries(tenantId, scopedOrganizationId);
  const setActive = useSetRecurringJournalEntryActive(tenantId);

  async function handleToggleActive(id: string, nextIsActive: boolean) {
    try {
      await setActive.mutateAsync({ id, isActive: nextIsActive });
      toast.success(nextIsActive ? 'Resumed' : 'Paused');
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'Failed to update recurring journal entry'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <Button asChild>
          <Link href="/finance/recurring-journal-entries/new">
            <Plus className="size-4" />
            New recurring entry
          </Link>
        </Button>
      </div>

      {isLoading && <TableSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load recurring journal entries')} />}

      {templates && templates.length === 0 && (
        <EmptyState
          icon={RefreshCw}
          title="No recurring journal entries yet"
          description="Set up a template above for entries like rent or depreciation that post automatically every month."
        />
      )}

      {templates && templates.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Day of month</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.description}</TableCell>
                  <TableCell className="text-muted-foreground">{template.currency}</TableCell>
                  <TableCell className="text-muted-foreground">{template.dayOfMonth}</TableCell>
                  <TableCell>{template.nextRunDate.slice(0, 10)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {template.lastRunDate ? template.lastRunDate.slice(0, 10) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? 'success' : 'secondary'}>
                      {template.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template.id, !template.isActive)}
                      disabled={setActive.isPending}
                    >
                      {template.isActive ? (
                        <>
                          <Pause className="size-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="size-4" />
                          Resume
                        </>
                      )}
                    </Button>
                    <DeleteRecurringJournalEntryDialog
                      tenantId={tenantId}
                      id={template.id}
                      description={template.description}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
