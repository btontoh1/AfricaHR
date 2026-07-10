'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateReviewCycle } from './queries';
import { reviewCycleFormSchema, type ReviewCycleFormValues } from './performance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function CreateReviewCycleForm({ tenantId }: { tenantId: string }) {
  const createCycle = useCreateReviewCycle(tenantId);

  const form = useForm<ReviewCycleFormValues>({
    resolver: zodResolver(reviewCycleFormSchema),
    defaultValues: { name: '', startDate: '', endDate: '' },
  });

  async function onSubmit(values: ReviewCycleFormValues) {
    try {
      await createCycle.mutateAsync(values);
      toast.success('Review cycle created');
      form.reset({ name: '', startDate: '', endDate: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create review cycle'));
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
                <Input placeholder="Q1 2026 Review" className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add cycle'}
        </Button>
      </form>
    </Form>
  );
}
