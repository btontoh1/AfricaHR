'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  advanceApplicationFormSchema,
  APPLICATION_STAGE_OPTIONS,
  type AdvanceApplicationFormValues,
} from './recruitment-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import type { AdvanceApplicationInput, ApplicationStage } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AdvanceStageControl({
  currentStage,
  onAdvance,
}: {
  currentStage: ApplicationStage;
  onAdvance: (input: AdvanceApplicationInput) => Promise<unknown>;
}) {
  const form = useForm<AdvanceApplicationFormValues>({
    resolver: zodResolver(advanceApplicationFormSchema),
    defaultValues: { stage: currentStage, rejectionReason: '', notes: '' },
  });

  const selectedStage = form.watch('stage');

  async function onSubmit(values: AdvanceApplicationFormValues) {
    try {
      await onAdvance({
        stage: values.stage,
        rejectionReason: values.rejectionReason ? values.rejectionReason : undefined,
        notes: values.notes ? values.notes : undefined,
      });
      toast.success('Application stage updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update application stage'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move stage</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPLICATION_STAGE_OPTIONS.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedStage === 'REJECTED' && (
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Rejection reason</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Update stage'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
