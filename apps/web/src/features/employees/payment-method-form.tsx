'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMyPaymentMethod, useUpsertMyPaymentMethod } from './queries';
import { paymentMethodFormSchema, type PaymentMethodFormValues } from './payment-method-form-schema';
import type { PaymentMethod } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_VALUES: PaymentMethodFormValues = {
  type: 'BANK_ACCOUNT',
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountName: '',
  mobileMoneyProvider: '',
  mobileMoneyNumber: '',
};

function Fields({ tenantId, existing }: { tenantId: string; existing: PaymentMethod | null }) {
  const upsert = useUpsertMyPaymentMethod(tenantId);

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodFormSchema),
    defaultValues: existing
      ? {
          type: existing.type,
          bankName: existing.bankName ?? '',
          bankCode: existing.bankCode ?? '',
          accountNumber: existing.accountNumber ?? '',
          accountName: existing.accountName ?? '',
          mobileMoneyProvider: existing.mobileMoneyProvider ?? '',
          mobileMoneyNumber: existing.mobileMoneyNumber ?? '',
        }
      : EMPTY_VALUES,
  });

  const type = form.watch('type');

  async function onSubmit(values: PaymentMethodFormValues) {
    // React Hook Form keeps a hidden field's last value around even after
    // switching type away from it, so submit only the fields for the
    // selected type - otherwise switching BANK_ACCOUNT -> MOBILE_MONEY
    // would resubmit the old (now-irrelevant) bank details as if the user
    // had just entered them.
    const isBankAccount = values.type === 'BANK_ACCOUNT';
    try {
      await upsert.mutateAsync({
        type: values.type,
        bankName: isBankAccount ? values.bankName || undefined : undefined,
        bankCode: values.bankCode || undefined,
        accountNumber: isBankAccount ? values.accountNumber || undefined : undefined,
        accountName: isBankAccount ? values.accountName || undefined : undefined,
        mobileMoneyProvider: isBankAccount ? undefined : values.mobileMoneyProvider || undefined,
        mobileMoneyNumber: isBankAccount ? undefined : values.mobileMoneyNumber || undefined,
      });
      toast.success('Payment details saved');
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, 'Failed to save payment details'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!existing && (
          <p className="text-sm text-muted-foreground">
            No payment details on file yet — add how you&apos;d like to be paid below.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>How would you like to be paid?</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BANK_ACCOUNT">Bank account</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile money</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'BANK_ACCOUNT' && (
              <div className="grid gap-4 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank name</FormLabel>
                      <FormControl>
                        <Input placeholder="GCB Bank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 040" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name on the account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {type === 'MOBILE_MONEY' && (
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="mobileMoneyProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="MTN Mobile Money" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MTN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobileMoneyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile money number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function PaymentMethodForm({ tenantId }: { tenantId: string }) {
  const { data: paymentMethod, isLoading, isError, error } = useMyPaymentMethod(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load payment details')} />;
  }

  return <Fields tenantId={tenantId} existing={paymentMethod ?? null} />;
}
