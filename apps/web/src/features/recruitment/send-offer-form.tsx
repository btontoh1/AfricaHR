'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSendOffer } from './queries';
import { sendOfferFormSchema, type SendOfferFormValues } from './recruitment-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function SendOfferForm({ tenantId, applicationId }: { tenantId: string; applicationId: string }) {
  const sendOffer = useSendOffer(tenantId, applicationId);

  const form = useForm<SendOfferFormValues>({
    resolver: zodResolver(sendOfferFormSchema),
    defaultValues: { offeredSalary: '', offeredStartDate: '' },
  });

  async function onSubmit(values: SendOfferFormValues) {
    try {
      await sendOffer.mutateAsync({
        offeredSalary: Number(values.offeredSalary),
        offeredStartDate: values.offeredStartDate,
      });
      toast.success('Offer sent');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send offer'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send offer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
            <FormField
              control={form.control}
              name="offeredSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offered salary</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" className="w-40" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="offeredStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offered start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending…' : 'Send offer'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
