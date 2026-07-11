'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSendNotification } from './queries';
import {
  NOTIFICATION_CHANNEL_OPTIONS,
  sendNotificationFormSchema,
  type SendNotificationFormValues,
} from './notifications-form-schema';
import { UserPicker } from '@/features/iam/user-picker';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function SendNotificationForm({ tenantId }: { tenantId: string }) {
  const sendNotification = useSendNotification(tenantId);

  const form = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationFormSchema),
    defaultValues: { userId: '', channel: 'IN_APP', subject: '', body: '' },
  });

  async function onSubmit(values: SendNotificationFormValues) {
    try {
      await sendNotification.mutateAsync(values);
      toast.success('Notification sent');
      form.reset({ userId: '', channel: values.channel, subject: '', body: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send notification'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a notification</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="w-64">
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <UserPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTIFICATION_CHANNEL_OPTIONS.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {channel}
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
              name="subject"
              render={({ field }) => (
                <FormItem className="w-64">
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending…' : 'Send'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
