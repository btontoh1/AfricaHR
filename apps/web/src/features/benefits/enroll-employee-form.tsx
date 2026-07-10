'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEnrollEmployee } from './queries';
import { enrollEmployeeFormSchema, type EnrollEmployeeFormValues } from './benefits-form-schema';
import { BenefitPlanPicker } from './benefit-plan-picker';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function EnrollEmployeeForm({ tenantId }: { tenantId: string }) {
  const enrollEmployee = useEnrollEmployee(tenantId);

  const form = useForm<EnrollEmployeeFormValues>({
    resolver: zodResolver(enrollEmployeeFormSchema),
    defaultValues: { employeeId: '', benefitPlanId: '', effectiveDate: '' },
  });

  async function onSubmit(values: EnrollEmployeeFormValues) {
    try {
      await enrollEmployee.mutateAsync({
        employeeId: values.employeeId,
        benefitPlanId: values.benefitPlanId,
        effectiveDate: values.effectiveDate ? values.effectiveDate : undefined,
      });
      toast.success('Employee enrolled');
      form.reset({ employeeId: '', benefitPlanId: '', effectiveDate: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to enroll employee'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enroll an employee</CardTitle>
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
              name="benefitPlanId"
              render={({ field }) => (
                <FormItem className="w-56">
                  <FormLabel>Plan</FormLabel>
                  <FormControl>
                    <BenefitPlanPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enrolling…' : 'Enroll'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
