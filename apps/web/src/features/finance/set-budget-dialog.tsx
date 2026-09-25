'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useAccounts, useSetBudget } from './queries';
import { AccountPicker } from './account-picker';
import { getApiErrorMessage } from '@/lib/api-error';
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

const setBudgetFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  accountCode: z.string().min(1, 'Account is required'),
  fiscalYear: z.string().min(4, 'Fiscal year is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  amount: z.string().min(1, 'Amount is required'),
});

type SetBudgetFormValues = z.infer<typeof setBudgetFormSchema>;

export function SetBudgetDialog({
  tenantId,
  defaultOrganizationId,
  defaultFiscalYear,
}: {
  tenantId: string;
  defaultOrganizationId?: string;
  defaultFiscalYear: number;
}) {
  const [open, setOpen] = useState(false);
  const { data: accounts } = useAccounts(tenantId);
  const setBudget = useSetBudget(tenantId);

  const emptyValues: SetBudgetFormValues = {
    organizationId: defaultOrganizationId ?? '',
    accountCode: '',
    fiscalYear: String(defaultFiscalYear),
    currency: '',
    amount: '',
  };

  const form = useForm<SetBudgetFormValues>({
    resolver: zodResolver(setBudgetFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: SetBudgetFormValues) {
    const account = accounts?.find((candidate) => candidate.code === values.accountCode);
    if (!account) {
      toast.error('Select an account');
      return;
    }
    try {
      await setBudget.mutateAsync({
        organizationId: values.organizationId,
        accountId: account.id,
        fiscalYear: Number(values.fiscalYear),
        currency: values.currency,
        amount: Number(values.amount),
      });
      toast.success('Budget set');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to set budget'));
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
          Set budget
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set a budget</DialogTitle>
          <DialogDescription>
            Setting a budget again for the same organization, account, fiscal year, and currency
            overwrites the amount - it doesn&apos;t add a second one.
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <AccountPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fiscalYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal year</FormLabel>
                    <FormControl>
                      <Input type="number" min={2000} max={2100} {...field} />
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
                            {currency.symbol} {currency.code} — {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budgeted amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
