'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAttendancePolicy, useUpsertAttendancePolicy } from './queries';
import {
  attendancePolicyFormSchema,
  type AttendancePolicyFormValues,
} from './attendance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

function PolicyForm({
  tenantId,
  defaultStandardDailyHours,
  notConfiguredYet,
}: {
  tenantId: string;
  defaultStandardDailyHours: string;
  notConfiguredYet: boolean;
}) {
  const upsertPolicy = useUpsertAttendancePolicy(tenantId);

  const form = useForm<AttendancePolicyFormValues>({
    resolver: zodResolver(attendancePolicyFormSchema),
    defaultValues: { standardDailyHours: defaultStandardDailyHours },
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
      <CardContent className="space-y-4">
        {notConfiguredYet && (
          <p className="text-sm text-muted-foreground">
            No attendance policy configured yet — set the standard daily hours below. Hours
            worked beyond this threshold count as overtime.
          </p>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-wrap items-end gap-3"
          >
            <FormField
              control={form.control}
              name="standardDailyHours"
              render={({ field }) => (
                <FormItem>
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

export function AttendancePolicyForm({ tenantId }: { tenantId: string }) {
  const { data: policy, isLoading, isError } = useAttendancePolicy(tenantId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <PolicyForm
      tenantId={tenantId}
      defaultStandardDailyHours={policy?.standardDailyHours ?? ''}
      notConfiguredYet={isError}
    />
  );
}
