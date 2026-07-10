'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useStartMyReview } from './queries';
import { startReviewFormSchema, type StartReviewFormValues } from './performance-form-schema';
import { ReviewCyclePicker } from './review-cycle-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function StartReviewForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const startReview = useStartMyReview(tenantId);

  const form = useForm<StartReviewFormValues>({
    resolver: zodResolver(startReviewFormSchema),
    defaultValues: { cycleId: '' },
  });

  async function onSubmit(values: StartReviewFormValues) {
    try {
      const review = await startReview.mutateAsync(values.cycleId);
      toast.success('Review started');
      router.push(`/performance/reviews/${review.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to start review'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="cycleId"
          render={({ field }) => (
            <FormItem className="w-64">
              <FormLabel>Start a review</FormLabel>
              <FormControl>
                <ReviewCyclePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Starting…' : 'Start'}
        </Button>
      </form>
    </Form>
  );
}
