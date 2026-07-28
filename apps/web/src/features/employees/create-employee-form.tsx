'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateEmployee } from './queries';
import { employeeFormSchema, EMPLOYMENT_TYPE_OPTIONS, type EmployeeFormValues } from './employee-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';
import { EmployeePicker } from './employee-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function CreateEmployeeForm() {
  const router = useRouter();
  const session = useSession();
  const tenantId = session.tenantId as string;
  const createEmployee = useCreateEmployee(tenantId);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      organizationId: '',
      organizationUnitId: '',
      managerId: '',
      employeeNumber: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      phone: '',
      personalEmail: '',
      jobTitle: '',
      employmentType: 'FULL_TIME',
      hireDate: '',
      baseSalary: '',
      payFrequency: '',
      currency: '',
      annualRentPaid: '',
      countryCode: '',
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    try {
      const employee = await createEmployee.mutateAsync({
        organizationId: values.organizationId,
        organizationUnitId: toOptional(values.organizationUnitId),
        managerId: toOptional(values.managerId),
        employeeNumber: toOptional(values.employeeNumber),
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: toOptional(values.dateOfBirth),
        gender: toOptional(values.gender),
        nationality: toOptional(values.nationality),
        phone: toOptional(values.phone),
        personalEmail: toOptional(values.personalEmail),
        jobTitle: values.jobTitle,
        employmentType: values.employmentType,
        hireDate: values.hireDate,
        baseSalary: values.baseSalary ? Number(values.baseSalary) : undefined,
        payFrequency: toOptional(values.payFrequency),
        currency: toOptional(values.currency),
        annualRentPaid: values.annualRentPaid ? Number(values.annualRentPaid) : undefined,
        countryCode: values.countryCode,
      });
      toast.success('Employee created');
      router.push(`/employees/${employee.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create employee'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker
                      tenantId={tenantId}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        form.setValue('organizationUnitId', '');
                      }}
                    />
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
                  <FormLabel>Organization unit (optional)</FormLabel>
                  <FormControl>
                    <OrganizationUnitPicker
                      tenantId={tenantId}
                      organizationId={form.watch('organizationId')}
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
                  <FormLabel>Reporting manager (optional)</FormLabel>
                  <FormControl>
                    <EmployeePicker
                      tenantId={tenantId}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      allowClear
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Auto-generated if omitted, e.g. EMP-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of birth (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
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
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country code</FormLabel>
                  <FormControl>
                    <Input placeholder="GH" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensation (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
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
                  <FormControl>
                    <Input placeholder="MONTHLY" {...field} />
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
                    <Input placeholder="GHS" maxLength={3} {...field} />
                  </FormControl>
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating…' : 'Create employee'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
