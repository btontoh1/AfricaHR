'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { useRequestWalletTopUp } from './queries';
import { requestTopUpFormSchema, type RequestTopUpFormValues } from './request-topup-form-schema';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function RequestTopUpDialog({ tenantId, defaultCurrency }: { tenantId: string; defaultCurrency?: string }) {
  const [open, setOpen] = useState(false);
  const requestTopUp = useRequestWalletTopUp(tenantId);

  const form = useForm<RequestTopUpFormValues>({
    resolver: zodResolver(requestTopUpFormSchema),
    defaultValues: { currency: defaultCurrency ?? '', amount: '' },
  });

  async function onSubmit(values: RequestTopUpFormValues) {
    try {
      const topUp = await requestTopUp.mutateAsync({
        currency: values.currency,
        amount: Number(values.amount),
      });
      form.reset();
      setOpen(false);
      if (topUp?.checkoutUrl) {
        // Same pattern as an invoice's Checkout link - opened in a new tab
        // so the in-progress top-up list stays visible behind it.
        window.open(topUp.checkoutUrl, '_blank', 'noreferrer');
      } else {
        toast.success('Top-up requested');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to request top-up'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Wallet className="size-4" />
          Top up wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top up payroll wallet</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step="0.01" placeholder="e.g. 5000" {...field} />
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
                  <FormControl>
                    <Input maxLength={3} placeholder="e.g. GHS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Starting checkout…' : 'Continue to checkout'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
