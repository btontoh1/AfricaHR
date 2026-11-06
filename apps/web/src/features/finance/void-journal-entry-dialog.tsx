'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useVoidJournalEntry } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function VoidJournalEntryDialog({ tenantId, entryId }: { tenantId: string; entryId: string }) {
  const [open, setOpen] = useState(false);
  const voidEntry = useVoidJournalEntry(tenantId);

  async function handleVoid() {
    try {
      await voidEntry.mutateAsync(entryId);
      toast.success('Journal entry voided');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to void journal entry'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Void
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void this journal entry?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This posts a reversing entry (the same amounts, debit and credit swapped) and marks this entry
          as voided. It stays in the ledger for the audit trail - it is never deleted - and this action
          cannot be undone from the UI. Post a new manual entry if the activity still needs to be
          recorded correctly.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={voidEntry.isPending}>
            Keep entry
          </Button>
          <Button variant="destructive" onClick={handleVoid} disabled={voidEntry.isPending}>
            {voidEntry.isPending ? 'Voiding…' : 'Void entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
