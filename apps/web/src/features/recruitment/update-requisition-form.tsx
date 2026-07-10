'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  REQUISITION_STATUS_OPTIONS,
  updateRequisitionFormSchema,
  type UpdateRequisitionFormValues,
} from './recruitment-form-schema';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import type { JobRequisition, UpdateJobRequisitionInput } from './types';
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

export function UpdateRequisitionForm({
  tenantId,
  requisition,
  onUpdate,
}: {
  tenantId: string;
  requisition: JobRequisition;
  onUpdate: (input: UpdateJobRequisitionInput) => Promise<unknown>;
}) {
  const form = useForm<UpdateRequisitionFormValues>({
    resolver: zodResolver(updateRequisitionFormSchema),
    defaultValues: {
      title: requisition.title,
      description: requisition.description ?? '',
      organizationUnitId: requisition.organizationUnitId ?? '',
      hiringManagerId: requisition.hiringManagerId ?? '',
      openings: String(requisition.openings),
      status: requisition.status,
      targetHireDate: requisition.targetHireDate ? requisition.targetHireDate.slice(0, 10) : '',
    },
  });

  async function onSubmit(values: UpdateRequisitionFormValues) {
    try {
      await onUpdate({
        title: values.title,
        description: values.description ? values.description : undefined,
        organizationUnitId: values.organizationUnitId ? values.organizationUnitId : undefined,
        hiringManagerId: values.hiringManagerId ? values.hiringManagerId : undefined,
        openings: Number(values.openings),
        status: values.status,
        targetHireDate: values.targetHireDate ? values.targetHireDate : undefined,
      });
      toast.success('Job requisition updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update job requisition'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REQUISITION_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
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
            name="openings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Openings</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetHireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target hire date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="hiringManagerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hiring manager</FormLabel>
              <FormControl>
                <EmployeePicker tenantId={tenantId} value={field.value ?? ''} onChange={field.onChange} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
