'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateOrganizationUnit } from './queries';
import {
  organizationUnitFormSchema,
  type OrganizationUnitFormValues,
} from './organization-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function CreateOrganizationUnitForm({
  tenantId,
  organizationId,
}: {
  tenantId: string;
  organizationId: string;
}) {
  const createUnit = useCreateOrganizationUnit(tenantId, organizationId);

  const form = useForm<OrganizationUnitFormValues>({
    resolver: zodResolver(organizationUnitFormSchema),
    defaultValues: { name: '', code: '', parentId: '' },
  });

  async function onSubmit(values: OrganizationUnitFormValues) {
    try {
      await createUnit.mutateAsync({
        organizationId,
        name: values.name,
        code: values.code,
        parentId: values.parentId ? values.parentId : undefined,
      });
      toast.success('Unit created');
      form.reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create unit'));
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
                <Input placeholder="Human Resources" className="w-48" {...field} />
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
                <Input placeholder="HR" className="w-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent unit ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Unit UUID" className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add unit'}
        </Button>
      </form>
    </Form>
  );
}
