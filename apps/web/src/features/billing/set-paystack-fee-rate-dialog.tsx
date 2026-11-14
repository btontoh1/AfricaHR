'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useUpsertPaystackFeeRate } from './queries';
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

const setPaystackFeeRateFormSchema = z.object({
  currency: z.string().length(3, 'Use a 3-letter currency code (e.g. GHS)'),
  channel: z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY']),
  feeAmount: z.string().min(1, 'Fee is required'),
});

type SetPaystackFeeRateFormValues = z.infer<typeof setPaystackFeeRateFormSchema>;

const emptyValues: SetPaystackFeeRateFormValues = {
  currency: '',
  channel: 'MOBILE_MONEY',
  feeAmount: '',
};

export function SetPaystackFeeRateDialog() {
  const [open, setOpen] = useState(false);
  const upsertRate = useUpsertPaystackFeeRate();

  const form = useForm<SetPaystackFeeRateFormValues>({
    resolver: zodResolver(setPaystackFeeRateFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: SetPaystackFeeRateFormValues) {
    try {
      await upsertRate.mutateAsync({
        currency: values.currency,
        channel: values.channel,
        feeAmount: Number(values.feeAmount),
      });
      toast.success('Paystack fee rate saved');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save Paystack fee rate'));
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
          Set fee rate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Paystack transfer fee</DialogTitle>
          <DialogDescription>
            What Paystack itself charges ParotHR to send one transfer in this currency and channel -
            not ParotHR&apos;s own margin (set per tenant on their subscription instead). Setting a rate
            again for the same currency and channel replaces it. This is passed through to the tenant
            at disbursement time, on top of ParotHR&apos;s margin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MOBILE_MONEY">Mobile money</SelectItem>
                        <SelectItem value="BANK_ACCOUNT">Bank account</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="feeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paystack&apos;s real transfer cost</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save fee rate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
