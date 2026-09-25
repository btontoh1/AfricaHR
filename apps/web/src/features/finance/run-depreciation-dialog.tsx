'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { PlayCircle } from 'lucide-react';
import { useRunDepreciation } from './queries';
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

const runDepreciationFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. USD)'),
  asOfDate: z.string().min(1, 'Date is required'),
});

type RunDepreciationFormValues = z.infer<typeof runDepreciationFormSchema>;

export function RunDepreciationDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const runDepreciation = useRunDepreciation(tenantId);

  const emptyValues: RunDepreciationFormValues = {
    organizationId: '',
    currency: '',
    asOfDate: new Date().toISOString().slice(0, 10),
  };

  const form = useForm<RunDepreciationFormValues>({
    resolver: zodResolver(runDepreciationFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: RunDepreciationFormValues) {
    try {
      const result = await runDepreciation.mutateAsync(values);
      if (result.assetCount === 0) {
        toast.success('Depreciation run recorded - nothing was due');
      } else {
        toast.success(
          `Depreciation posted for ${result.assetCount} asset${result.assetCount === 1 ? '' : 's'} - ${formatCurrency(result.totalDepreciation, values.currency)}`,
        );
      }
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to run depreciation'));
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
        <Button variant="outline">
          <PlayCircle className="size-4" />
          Run depreciation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run depreciation</DialogTitle>
          <DialogDescription>
            Depreciates every active asset in this organization/currency whose schedule is due by this
            date, one period each, and posts a single combined entry for the total.
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
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Running…' : 'Run depreciation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
