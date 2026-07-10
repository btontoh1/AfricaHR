'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateAttendanceRecord } from './queries';
import {
  updateAttendanceRecordFormSchema,
  type UpdateAttendanceRecordFormValues,
} from './attendance-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import type { AttendanceRecord } from './types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function UpdateAttendanceRecordForm({
  tenantId,
  record,
}: {
  tenantId: string;
  record: AttendanceRecord;
}) {
  const updateRecord = useUpdateAttendanceRecord(tenantId, record.id);

  const form = useForm<UpdateAttendanceRecordFormValues>({
    resolver: zodResolver(updateAttendanceRecordFormSchema),
    defaultValues: {
      clockIn: toDatetimeLocal(record.clockIn),
      clockOut: toDatetimeLocal(record.clockOut),
      notes: record.notes ?? '',
    },
  });

  async function onSubmit(values: UpdateAttendanceRecordFormValues) {
    try {
      await updateRecord.mutateAsync({
        clockIn: toIso(values.clockIn ?? ''),
        clockOut: toIso(values.clockOut ?? ''),
        notes: values.notes ? values.notes : undefined,
      });
      toast.success('Attendance record updated');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update attendance record'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clockIn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clock in</FormLabel>
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
                <FormLabel>Clock out</FormLabel>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
