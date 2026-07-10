'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateLeaveType } from './queries';
import { leaveTypeFormSchema, type LeaveTypeFormValues } from './leave-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function CreateLeaveTypeForm({ tenantId }: { tenantId: string }) {
  const createLeaveType = useCreateLeaveType(tenantId);

  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeFormSchema),
    defaultValues: { name: '', code: '', isPaid: true, defaultEntitlementDays: '' },
  });

  async function onSubmit(values: LeaveTypeFormValues) {
    try {
      await createLeaveType.mutateAsync({
        name: values.name,
        code: values.code,
        isPaid: values.isPaid,
        defaultEntitlementDays: Number(values.defaultEntitlementDays),
      });
      toast.success('Leave type created');
      form.reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create leave type'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Annual Leave" className="w-48" {...field} />
              </FormControl>
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
                <Input placeholder="ANNUAL" className="w-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultEntitlementDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days/year</FormLabel>
              <FormControl>
                <Input type="number" min={0} className="w-28" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPaid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 pb-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Paid</FormLabel>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add leave type'}
        </Button>
      </form>
    </Form>
  );
}
