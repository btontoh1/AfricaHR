'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateApplication } from './queries';
import {
  createApplicationFormSchema,
  type CreateApplicationFormValues,
} from './recruitment-form-schema';
import { CandidatePicker } from './candidate-picker';
import { RequisitionPicker } from './requisition-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function CreateApplicationForm({ tenantId }: { tenantId: string }) {
  const createApplication = useCreateApplication(tenantId);

  const form = useForm<CreateApplicationFormValues>({
    resolver: zodResolver(createApplicationFormSchema),
    defaultValues: { candidateId: '', requisitionId: '' },
  });

  async function onSubmit(values: CreateApplicationFormValues) {
    try {
      await createApplication.mutateAsync(values);
      toast.success('Application created');
      form.reset({ candidateId: '', requisitionId: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create application'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="candidateId"
          render={({ field }) => (
            <FormItem className="w-64">
              <FormLabel>Candidate</FormLabel>
              <FormControl>
                <CandidatePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requisitionId"
          render={({ field }) => (
            <FormItem className="w-64">
              <FormLabel>Requisition</FormLabel>
              <FormControl>
                <RequisitionPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add to pipeline'}
        </Button>
      </form>
    </Form>
  );
}
