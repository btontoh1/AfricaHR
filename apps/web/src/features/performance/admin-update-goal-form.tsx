'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateGoal } from './queries';
import {
  GOAL_STATUS_OPTIONS,
  updateGoalFormSchema,
  type UpdateGoalFormValues,
} from './performance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import type { PerformanceGoal } from './types';
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

export function AdminUpdateGoalForm({
  tenantId,
  goal,
  onDone,
}: {
  tenantId: string;
  goal: PerformanceGoal;
  onDone: () => void;
}) {
  const updateGoal = useUpdateGoal(tenantId, goal.id);

  const form = useForm<UpdateGoalFormValues>({
    resolver: zodResolver(updateGoalFormSchema),
    defaultValues: {
      title: goal.title,
      description: goal.description ?? '',
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
      status: goal.status,
      progressPercent: String(goal.progressPercent),
    },
  });

  async function onSubmit(values: UpdateGoalFormValues) {
    try {
      await updateGoal.mutateAsync({
        title: values.title,
        description: values.description ? values.description : undefined,
        targetDate: values.targetDate ? values.targetDate : undefined,
        status: values.status,
        progressPercent: Number(values.progressPercent),
      });
      toast.success('Goal updated');
      onDone();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update goal'));
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
                <Input className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GOAL_STATUS_OPTIONS.map((status) => (
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
          name="progressPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress %</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={100} className="w-24" {...field} />
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
              <FormLabel>Target date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </form>
    </Form>
  );
}
