'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAddPayslipLineItem } from './queries';
import {
  payslipLineItemFormSchema,
  LINE_ITEM_TYPE_OPTIONS,
  type PayslipLineItemFormValues,
} from './payroll-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AddLineItemForm({ tenantId, payslipId }: { tenantId: string; payslipId: string }) {
  const addLineItem = useAddPayslipLineItem(tenantId, payslipId);

  const form = useForm<PayslipLineItemFormValues>({
    resolver: zodResolver(payslipLineItemFormSchema),
    defaultValues: { type: 'EARNING', code: '', description: '', amount: '' },
  });

  async function onSubmit(values: PayslipLineItemFormValues) {
    try {
      await addLineItem.mutateAsync({
        type: values.type,
        code: values.code,
        description: values.description ? values.description : undefined,
        amount: Number(values.amount),
      });
      toast.success('Line item added');
      form.reset({ type: values.type, code: '', description: '', amount: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add line item'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LINE_ITEM_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="OVERTIME" className="w-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional" className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.01" className="w-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add line item'}
        </Button>
      </form>
    </Form>
  );
}
