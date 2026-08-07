'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateEmployee } from './queries';
import {
  UPDATE_EMPLOYMENT_TYPE_OPTIONS,
  UPDATE_GENDER_OPTIONS,
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
      firstName: employee.firstName,
      lastName: employee.lastName,
      dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? '',
      gender: (employee.gender as UpdateEmployeeFormValues['gender']) ?? '',
      nationality: employee.nationality ?? '',
      phone: employee.phone ?? '',
      personalEmail: employee.personalEmail ?? '',
      parents: (employee.familyMembers ?? [])
        .filter((member) => member.relationship === 'PARENT')
        .map((member) => ({ name: member.name, dateOfBirth: member.dateOfBirth?.slice(0, 10) ?? '' })),
      children: (employee.familyMembers ?? [])
        .filter((member) => member.relationship === 'CHILD')
        .map((member) => ({ name: member.name, dateOfBirth: member.dateOfBirth?.slice(0, 10) ?? '' })),
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType,
      hireDate: employee.hireDate?.slice(0, 10) ?? '',
      baseSalary: employee.baseSalary ?? '',
      payFrequency: employee.payFrequency ?? '',
      annualRentPaid: employee.annualRentPaid ?? '',
      countryCode: employee.countryCode,
    },
  });

  const parentFields = useFieldArray({ control: form.control, name: 'parents' });
  const childFields = useFieldArray({ control: form.control, name: 'children' });

  async function onSubmit(values: UpdateEmployeeFormValues) {
    try {
      await updateEmployee.mutateAsync({
        organizationUnitId: toOptional(values.organizationUnitId) ?? null,
        managerId: toOptional(values.managerId) ?? null,
        userId: toOptional(values.userId) ?? null,
        firstName: values.firstName,
        lastName: values.lastName,
        dateOfBirth: toOptional(values.dateOfBirth) ?? null,
        gender: toOptional(values.gender) ?? null,
        nationality: toOptional(values.nationality) ?? null,
        phone: toOptional(values.phone) ?? null,
        personalEmail: toOptional(values.personalEmail) ?? null,
        familyMembers: [
          ...values.parents.map((parent) => ({
            relationship: 'PARENT' as const,
            name: parent.name,
            dateOfBirth: toOptional(parent.dateOfBirth),
          })),
          ...values.children.map((child) => ({
            relationship: 'CHILD' as const,
            name: child.name,
            dateOfBirth: toOptional(child.dateOfBirth),
          })),
        ],
        jobTitle: values.jobTitle,
        employmentType: values.employmentType,
        hireDate: values.hireDate,
        baseSalary: values.baseSalary ? Number(values.baseSalary) : null,
        payFrequency: toOptional(values.payFrequency) ?? null,
        annualRentPaid: values.annualRentPaid ? Number(values.annualRentPaid) : null,
        countryCode: values.countryCode,
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
              <FormLabel>Date of birth</FormLabel>
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
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UPDATE_GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender.replace(/_/g, ' ')}
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
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nationality</FormLabel>
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
              <FormLabel>Phone</FormLabel>
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
              <FormLabel>Personal email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sm:col-span-2 space-y-6">
          <div className="space-y-2">
            <FormLabel>Parents</FormLabel>
            {parentFields.fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-end gap-2">
                <FormField
                  control={form.control}
                  name={`parents.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Name" className="w-48" {...nameField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`parents.${index}.dateOfBirth`}
                  render={({ field: dobField }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="date" className="w-40" {...dobField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => parentFields.remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => parentFields.append({ name: '', dateOfBirth: '' })}
            >
              Add parent
            </Button>
          </div>

          <div className="space-y-2">
            <FormLabel>Children</FormLabel>
            {childFields.fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-end gap-2">
                <FormField
                  control={form.control}
                  name={`children.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Name" className="w-48" {...nameField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`children.${index}.dateOfBirth`}
                  render={({ field: dobField }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="date" className="w-40" {...dobField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => childFields.remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => childFields.append({ name: '', dateOfBirth: '' })}
            >
              Add child
            </Button>
          </div>
        </div>
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
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UPDATE_EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
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
