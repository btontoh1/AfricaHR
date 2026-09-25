'use client';

import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useAccounts, useCreateRecurringJournalEntry } from './queries';
import { previewJournalEntryBalance } from './journal-entry-form-schema';
import {
  recurringJournalEntryFormSchema,
  type RecurringJournalEntryFormValues,
} from './recurring-journal-entry-form-schema';
import { AccountPicker } from './account-picker';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function RecurringJournalEntryForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const { data: accounts } = useAccounts(tenantId);
  const createTemplate = useCreateRecurringJournalEntry(tenantId);

  const form = useForm<RecurringJournalEntryFormValues>({
    resolver: zodResolver(recurringJournalEntryFormSchema),
    defaultValues: {
      organizationId: '',
      description: '',
      currency: '',
      dayOfMonth: '1',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      lines: [
        { accountCode: '', side: 'debit', amount: '' },
        { accountCode: '', side: 'credit', amount: '' },
      ],
    },
  });

  const lineFields = useFieldArray({ control: form.control, name: 'lines' });
  const watchedLines = form.watch('lines');
  const balance = previewJournalEntryBalance(watchedLines);
  const watchedCurrency = form.watch('currency') || '—';

  async function onSubmit(values: RecurringJournalEntryFormValues) {
    const lines = values.lines.map((line) => {
      const account = accounts?.find((candidate) => candidate.code === line.accountCode);
      return { account, line };
    });
    const missing = lines.find(({ account }) => !account);
    if (missing) {
      toast.error('Select an account for every line');
      return;
    }

    try {
      await createTemplate.mutateAsync({
        organizationId: values.organizationId,
        description: values.description,
        currency: values.currency,
        dayOfMonth: Number(values.dayOfMonth),
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        lines: lines.map(({ account, line }) => ({
          accountId: account!.id,
          debit: line.side === 'debit' ? Number(line.amount) : undefined,
          credit: line.side === 'credit' ? Number(line.amount) : undefined,
        })),
      });
      toast.success('Recurring journal entry created');
      router.push('/finance/recurring-journal-entries');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create recurring journal entry'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <span className="mr-1">{currency.symbol}</span>
                          {currency.code} — {currency.name}
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
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Monthly office rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dayOfMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of month</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={28} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
                <FormField
                  control={form.control}
                  name={`lines.${index}.accountCode`}
                  render={({ field: accountField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Account</FormLabel>}
                      <FormControl>
                        <AccountPicker
                          tenantId={tenantId}
                          value={accountField.value}
                          onChange={accountField.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.side`}
                  render={({ field: sideField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Debit / Credit</FormLabel>}
                      <Select onValueChange={sideField.onChange} value={sideField.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lines.${index}.amount`}
                  render={({ field: amountField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Amount</FormLabel>}
                      <FormControl>
                        <Input type="number" min={0.01} step="0.01" {...amountField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => lineFields.remove(index)}
                  disabled={lineFields.fields.length <= 2}
                  aria-label="Remove line"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lineFields.append({ accountCode: '', side: 'debit', amount: '' })}
            >
              <Plus className="size-4" />
              Add line
            </Button>

            <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total debit</span>
                <span>{formatCurrency(balance.totalDebit, watchedCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total credit</span>
                <span>{formatCurrency(balance.totalCredit, watchedCurrency)}</span>
              </div>
              <div
                className={cn(
                  'flex justify-between font-medium',
                  balance.isBalanced ? 'text-emerald-600' : 'text-destructive',
                )}
              >
                <span>{balance.isBalanced ? 'Balanced' : 'Out of balance'}</span>
                <span>{formatCurrency(balance.totalDebit - balance.totalCredit, watchedCurrency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting || !balance.isBalanced}>
          {form.formState.isSubmitting ? 'Saving…' : 'Create recurring entry'}
        </Button>
        {!balance.isBalanced && (
          <p className="text-sm text-muted-foreground">
            Debits and credits must be equal before this template can be saved.
          </p>
        )}
      </form>
    </Form>
  );
}
