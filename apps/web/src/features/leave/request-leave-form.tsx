'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateMyLeaveRequest } from './queries';
import { leaveRequestFormSchema, type LeaveRequestFormValues } from './leave-form-schema';
import { LeaveTypePicker } from './leave-type-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function RequestLeaveForm() {
  const router = useRouter();
  const session = useSession();
  const tenantId = session.tenantId as string;
  const createLeaveRequest = useCreateMyLeaveRequest(tenantId);

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: { leaveTypeId: '', startDate: '', endDate: '', reason: '' },
  });

  async function onSubmit(values: LeaveRequestFormValues) {
    try {
      await createLeaveRequest.mutateAsync({
        leaveTypeId: values.leaveTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason ? values.reason : undefined,
      });
      toast.success('Leave request submitted');
      router.push('/leave');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit leave request'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request leave</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave type</FormLabel>
                  <FormControl>
                    <LeaveTypePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
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
                {form.formState.isSubmitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
