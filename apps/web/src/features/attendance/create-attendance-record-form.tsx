'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateAttendanceRecord } from './queries';
import {
  createAttendanceRecordFormSchema,
  type CreateAttendanceRecordFormValues,
} from './attendance-form-schema';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function toIso(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function CreateAttendanceRecordForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const createRecord = useCreateAttendanceRecord(tenantId);

  const form = useForm<CreateAttendanceRecordFormValues>({
    resolver: zodResolver(createAttendanceRecordFormSchema),
    defaultValues: { employeeId: '', date: '', clockIn: '', clockOut: '', notes: '' },
  });

  async function onSubmit(values: CreateAttendanceRecordFormValues) {
    try {
      const record = await createRecord.mutateAsync({
        employeeId: values.employeeId,
        date: values.date,
        clockIn: toIso(values.clockIn ?? ''),
        clockOut: toIso(values.clockOut ?? ''),
        notes: values.notes ? values.notes : undefined,
      });
      toast.success('Attendance record created');
      router.push(`/attendance/records/${record.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create attendance record'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add attendance record</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clockIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock in (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clockOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock out (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Add record'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
