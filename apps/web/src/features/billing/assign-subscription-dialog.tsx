'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import { useAssignSubscription } from './queries';
import {
  assignSubscriptionFormSchema,
  type AssignSubscriptionFormValues,
} from './assign-subscription-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function AssignSubscriptionDialog({
  tenantId,
  defaultCurrency,
  open,
  onOpenChange,
}: {
  tenantId: string;
  defaultCurrency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assignSubscription = useAssignSubscription(tenantId);

  const form = useForm<AssignSubscriptionFormValues>({
    resolver: zodResolver(assignSubscriptionFormSchema),
    defaultValues: { pricePerEmployee: '', currency: defaultCurrency },
  });

  async function onSubmit(values: AssignSubscriptionFormValues) {
    try {
      await assignSubscription.mutateAsync({
        pricePerEmployee: Number(values.pricePerEmployee),
        currency: values.currency,
      });
      toast.success('Subscription assigned');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to assign subscription'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a subscription</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="pricePerEmployee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per employee, per month</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" placeholder="e.g. 10" {...field} />
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
                <CreditCard className="size-4" />
                {form.formState.isSubmitting ? 'Assigning…' : 'Assign subscription'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
