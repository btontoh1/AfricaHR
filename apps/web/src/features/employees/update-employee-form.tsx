'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateEmployee } from './queries';
import {
  updateEmployeeFormSchema,
  type UpdateEmployeeFormValues,
} from './update-employee-form-schema';
import { PAY_FREQUENCY_OPTIONS } from './employee-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import type { Employee } from './types';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';
import { EmployeePicker } from './employee-picker';
import { UserPicker } from '@/features/iam/user-picker';
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

function toOptional(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function UpdateEmployeeForm({ tenantId, employee }: { tenantId: string; employee: Employee }) {
  const updateEmployee = useUpdateEmployee(tenantId, employee.id);

  const form = useForm<UpdateEmployeeFormValues>({
    resolver: zodResolver(updateEmployeeFormSchema),
    defaultValues: {
      organizationUnitId: employee.organizationUnitId ?? '',
      managerId: employee.managerId ?? '',
      userId: employee.userId ?? '',
      jobTitle: employee.jobTitle,
      baseSalary: employee.baseSalary ?? '',
      payFrequency: employee.payFrequency ?? '',
      annualRentPaid: employee.annualRentPaid ?? '',
    },
  });

  async function onSubmit(values: UpdateEmployeeFormValues) {
    try {
      await updateEmployee.mutateAsync({
        organizationUnitId: toOptional(values.organizationUnitId) ?? null,
        managerId: toOptional(values.managerId) ?? null,
        userId: toOptional(values.userId) ?? null,
        jobTitle: values.jobTitle,
        baseSalary: values.baseSalary ? Number(values.baseSalary) : null,
        payFrequency: toOptional(values.payFrequency) ?? null,
        annualRentPaid: values.annualRentPaid ? Number(values.annualRentPaid) : null,
      });
      toast.success('Employee updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update employee'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organizationUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization unit</FormLabel>
              <FormControl>
                <OrganizationUnitPicker
                  tenantId={tenantId}
                  organizationId={employee.organizationId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="managerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reporting manager</FormLabel>
              <FormControl>
                <EmployeePicker
                  tenantId={tenantId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  allowClear
                  excludeEmployeeId={employee.id}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portal access</FormLabel>
              <FormControl>
                <UserPicker value={field.value ?? ''} onChange={field.onChange} allowClear />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base salary</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="payFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay frequency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAY_FREQUENCY_OPTIONS.map((frequency) => (
                    <SelectItem key={frequency} value={frequency}>
                      {frequency.replace(/_/g, ' ')}
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
          name="annualRentPaid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Annual rent paid (Nigeria only)</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
