'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSubmitSelfAssessment } from './queries';
import { assessmentFormSchema, type AssessmentFormValues } from './performance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function SelfAssessmentForm({ tenantId, reviewId }: { tenantId: string; reviewId: string }) {
  const submitAssessment = useSubmitSelfAssessment(tenantId, reviewId);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: { rating: '', comments: '' },
  });

  async function onSubmit(values: AssessmentFormValues) {
    try {
      await submitAssessment.mutateAsync({
        selfRating: Number(values.rating),
        selfComments: values.comments ? values.comments : undefined,
      });
      toast.success('Self-assessment submitted');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit self-assessment'));
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
              <FormLabel>Self rating (1-5)</FormLabel>
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
          {form.formState.isSubmitting ? 'Submitting…' : 'Submit self-assessment'}
        </Button>
      </form>
    </Form>
  );
}
