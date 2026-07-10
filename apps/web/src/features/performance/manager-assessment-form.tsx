'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSubmitManagerAssessment } from './queries';
import { assessmentFormSchema, type AssessmentFormValues } from './performance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function ManagerAssessmentForm({ tenantId, reviewId }: { tenantId: string; reviewId: string }) {
  const submitAssessment = useSubmitManagerAssessment(tenantId, reviewId);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: { rating: '', comments: '' },
  });

  async function onSubmit(values: AssessmentFormValues) {
    try {
      await submitAssessment.mutateAsync({
        managerRating: Number(values.rating),
        managerComments: values.comments ? values.comments : undefined,
      });
      toast.success('Manager assessment submitted');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit manager assessment'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manager rating (1-5)</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={5} className="w-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Comments</FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting…' : 'Complete review'}
        </Button>
      </form>
    </Form>
  );
}
