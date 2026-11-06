'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useSetOperatingCost } from './queries';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const setOperatingCostFormSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM format'),
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
});

type SetOperatingCostFormValues = z.infer<typeof setOperatingCostFormSchema>;

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function SetOperatingCostDialog() {
  const [open, setOpen] = useState(false);
  const setOperatingCost = useSetOperatingCost();

  const emptyValues: SetOperatingCostFormValues = {
    month: currentMonthKey(),
    currency: '',
    amount: '',
    notes: '',
  };

  const form = useForm<SetOperatingCostFormValues>({
    resolver: zodResolver(setOperatingCostFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: SetOperatingCostFormValues) {
    try {
      await setOperatingCost.mutateAsync({
        month: values.month,
        currency: values.currency,
        amount: Number(values.amount),
        notes: values.notes || undefined,
      });
      toast.success('Operating cost saved');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save operating cost'));
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
        <Button variant="outline" size="sm">
          <Plus className="size-4" />
          Enter monthly cost
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter operating cost</DialogTitle>
          <DialogDescription>
            ParotHR&apos;s own total operating cost for one month - salaries, infrastructure, tooling,
            and so on. Entering a cost again for the same month and currency overwrites it. This feeds
            the profit margin half of the Rule of 40 score below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
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
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total operating cost</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Payroll, hosting, and tooling" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save cost'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
