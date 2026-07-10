'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateMyGoal } from './queries';
import { createGoalFormSchema, type CreateGoalFormValues } from './performance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function CreateGoalForm({ tenantId }: { tenantId: string }) {
  const createGoal = useCreateMyGoal(tenantId);

  const form = useForm<CreateGoalFormValues>({
    resolver: zodResolver(createGoalFormSchema),
    defaultValues: { title: '', description: '', targetDate: '' },
  });

  async function onSubmit(values: CreateGoalFormValues) {
    try {
      await createGoal.mutateAsync({
        title: values.title,
        description: values.description ? values.description : undefined,
        targetDate: values.targetDate ? values.targetDate : undefined,
      });
      toast.success('Goal added');
      form.reset({ title: '', description: '', targetDate: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add goal'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Ship the Q1 roadmap" className="w-56" {...field} />
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
                <Input placeholder="Optional" className="w-64" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target date (optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add goal'}
        </Button>
      </form>
    </Form>
  );
}
