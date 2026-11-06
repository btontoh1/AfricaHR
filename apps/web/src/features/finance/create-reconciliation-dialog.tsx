'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCreateBankReconciliation } from './queries';
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

const createReconciliationFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  statementDate: z.string().min(1, 'Statement date is required'),
  statementEndingBalance: z.string().min(1, 'Statement ending balance is required'),
});

type CreateReconciliationFormValues = z.infer<typeof createReconciliationFormSchema>;

export function CreateReconciliationDialog({
  tenantId,
  defaultOrganizationId,
}: {
  tenantId: string;
  defaultOrganizationId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const createReconciliation = useCreateBankReconciliation(tenantId);

  const emptyValues: CreateReconciliationFormValues = {
    organizationId: defaultOrganizationId ?? '',
    currency: '',
    statementDate: '',
    statementEndingBalance: '',
  };

  const form = useForm<CreateReconciliationFormValues>({
    resolver: zodResolver(createReconciliationFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateReconciliationFormValues) {
    try {
      const reconciliation = await createReconciliation.mutateAsync({
        organizationId: values.organizationId,
        currency: values.currency,
        statementDate: values.statementDate,
        statementEndingBalance: Number(values.statementEndingBalance),
      });
      toast.success('Bank reconciliation started');
      setOpen(false);
      router.push(`/finance/bank-reconciliations/${reconciliation.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to start reconciliation'));
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
          New reconciliation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a bank reconciliation</DialogTitle>
          <DialogDescription>
            Enter the ending balance shown on your bank statement. You&apos;ll then mark which Cash and
            Bank journal lines have cleared until they add up to that balance.
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
            <div className="grid grid-cols-2 gap-3">
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
                name="statementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statement date</FormLabel>
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
              name="statementEndingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statement ending balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Starting…' : 'Start reconciliation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
