'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useStartReviewForEmployee } from './queries';
import {
  startReviewForEmployeeFormSchema,
  type StartReviewForEmployeeFormValues,
} from './performance-form-schema';
import { ReviewCyclePicker } from './review-cycle-picker';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function StartReviewForEmployeeForm({ tenantId }: { tenantId: string }) {
  const startReview = useStartReviewForEmployee(tenantId);

  const form = useForm<StartReviewForEmployeeFormValues>({
    resolver: zodResolver(startReviewForEmployeeFormSchema),
    defaultValues: { employeeId: '', cycleId: '' },
  });

  async function onSubmit(values: StartReviewForEmployeeFormValues) {
    try {
      await startReview.mutateAsync(values);
      toast.success('Review started');
      form.reset({ employeeId: '', cycleId: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to start review'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a review for an employee</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-wrap items-end gap-3"
          >
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem className="w-56">
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cycleId"
              render={({ field }) => (
                <FormItem className="w-56">
                  <FormLabel>Cycle</FormLabel>
                  <FormControl>
                    <ReviewCyclePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Starting…' : 'Start review'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
