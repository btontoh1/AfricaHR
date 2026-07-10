'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useLinkHiredEmployee } from './queries';
import {
  linkHiredEmployeeFormSchema,
  type LinkHiredEmployeeFormValues,
} from './recruitment-form-schema';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function LinkHiredEmployeeForm({
  tenantId,
  applicationId,
}: {
  tenantId: string;
  applicationId: string;
}) {
  const linkHiredEmployee = useLinkHiredEmployee(tenantId, applicationId);

  const form = useForm<LinkHiredEmployeeFormValues>({
    resolver: zodResolver(linkHiredEmployeeFormSchema),
    defaultValues: { employeeId: '' },
  });

  async function onSubmit(values: LinkHiredEmployeeFormValues) {
    try {
      await linkHiredEmployee.mutateAsync(values);
      toast.success('Hired employee linked');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to link the hired employee'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link hired employee</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create the Employee record via Employees first, then link it here.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem className="w-64">
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Linking…' : 'Link employee'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
