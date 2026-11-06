'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useSetHomeCurrency } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SetHomeCurrencyDialog({
  tenantId,
  organizationId,
  organizationName,
  currentCurrency,
}: {
  tenantId: string;
  organizationId: string;
  organizationName: string;
  currentCurrency: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency ?? '');
  const setHomeCurrency = useSetHomeCurrency(tenantId);

  async function handleSubmit() {
    if (!currency) {
      return;
    }
    try {
      await setHomeCurrency.mutateAsync({ organizationId, currency });
      toast.success(`${organizationName}'s home currency set to ${currency}`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to set home currency'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setCurrency(currentCurrency ?? '');
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentCurrency ? 'Change' : 'Set home currency'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{organizationName}&apos;s home currency</DialogTitle>
          <DialogDescription>
            The currency every FX revaluation for this organization converts foreign balances into.
            Changing it doesn&apos;t retroactively touch revaluations already posted under the old one.
          </DialogDescription>
        </DialogHeader>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {ALL_CURRENCIES.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.symbol} {option.code} — {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!currency || setHomeCurrency.isPending}>
            {setHomeCurrency.isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
