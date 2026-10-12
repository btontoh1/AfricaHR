'use client';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAttendancePolicy, useUpsertAttendancePolicy } from './queries';
import {
  attendancePolicyFormSchema,
  type AttendancePolicyFormValues,
} from './attendance-form-schema';
import type { AttendancePolicy } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/loading-state';

function PolicyForm({
  tenantId,
  defaultValues,
  notConfiguredYet,
}: {
  tenantId: string;
  defaultValues: AttendancePolicyFormValues;
  notConfiguredYet: boolean;
}) {
  const upsertPolicy = useUpsertAttendancePolicy(tenantId);

  const form = useForm<AttendancePolicyFormValues>({
    resolver: zodResolver(attendancePolicyFormSchema),
    defaultValues,
  });

  async function onSubmit(values: AttendancePolicyFormValues) {
    try {
      await upsertPolicy.mutateAsync({ standardDailyHours: Number(values.standardDailyHours) });
      toast.success('Attendance policy saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save attendance policy'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notConfiguredYet && (
          <p className="text-sm text-muted-foreground">
            No attendance policy configured yet — set the standard daily hours below. Hours
            worked beyond this threshold count as overtime.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
            <FormField
              control={form.control}
              name="standardDailyHours"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Standard daily hours</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.5" className="w-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function defaultValuesFromPolicy(policy?: AttendancePolicy): AttendancePolicyFormValues {
  return {
    standardDailyHours: policy?.standardDailyHours ?? '',
  };
}

export function AttendancePolicyForm({ tenantId }: { tenantId: string }) {
  const { data: policy, isLoading, isError } = useAttendancePolicy(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <PolicyForm
      tenantId={tenantId}
      defaultValues={defaultValuesFromPolicy(policy)}
      notConfiguredYet={isError}
    />
  );
}
