'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useHomeCurrency, useRunFxRevaluation } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const runFxRevaluationFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. USD)'),
  asOfDate: z.string().min(1, 'Date is required'),
  rate: z.string().min(1, 'Rate is required'),
});

type RunFxRevaluationFormValues = z.infer<typeof runFxRevaluationFormSchema>;

export function RunFxRevaluationDialog({
  tenantId,
  defaultOrganizationId,
}: {
  tenantId: string;
  defaultOrganizationId?: string;
}) {
  const [open, setOpen] = useState(false);
  const runRevaluation = useRunFxRevaluation(tenantId);

  const emptyValues: RunFxRevaluationFormValues = {
    organizationId: defaultOrganizationId ?? '',
    currency: '',
    asOfDate: new Date().toISOString().slice(0, 10),
    rate: '',
  };

  const form = useForm<RunFxRevaluationFormValues>({
    resolver: zodResolver(runFxRevaluationFormSchema),
    defaultValues: emptyValues,
  });

  const selectedOrganizationId = form.watch('organizationId');
  const { data: homeCurrency } = useHomeCurrency(tenantId, selectedOrganizationId);

  async function onSubmit(values: RunFxRevaluationFormValues) {
    if (!homeCurrency?.currency) {
      toast.error('Set a home currency for this organization before running a revaluation');
      return;
    }

    try {
      const result = await runRevaluation.mutateAsync({
        organizationId: values.organizationId,
        currency: values.currency,
        asOfDate: values.asOfDate,
        rate: Number(values.rate),
      });
      if (result.previousRate === null || result.previousRate === undefined) {
        toast.success(`Baseline rate recorded for ${values.currency} - the next revaluation will compute a gain/loss`);
      } else if (result.journalEntryId) {
        toast.success(`Revaluation posted - ${formatCurrency(result.gainLoss, homeCurrency.currency)} gain/loss`);
      } else {
        toast.success(`Revaluation recorded - no monetary balance in ${values.currency} as of this date`);
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to run FX revaluation'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset(emptyValues);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Run revaluation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run an FX revaluation</DialogTitle>
          <DialogDescription>
            Revalues every Cash and Bank/Accounts Receivable/Accounts Payable balance posted in this
            currency, as of this date, against the organization&apos;s home currency. The first
            revaluation for a currency only establishes the baseline rate - it won&apos;t post a
            gain/loss until the next one.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  {field.value && !homeCurrency?.currency && (
                    <p className="text-sm text-destructive">
                      This organization has no home currency set yet - set one on the Home Currency card first.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency being revalued</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.code} — {currency.name}{' '}
                            <span className="text-muted-foreground">({currency.symbol})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asOfDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>As of date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (units of the home currency per 1 unit of this currency)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.000001} step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Running…' : 'Run revaluation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
