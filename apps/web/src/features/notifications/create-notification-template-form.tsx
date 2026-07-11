'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateNotificationTemplate } from './queries';
import {
  notificationTemplateFormSchema,
  NOTIFICATION_CHANNEL_OPTIONS,
  type NotificationTemplateFormValues,
} from './notifications-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
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

export function CreateNotificationTemplateForm({ tenantId }: { tenantId: string }) {
  const createTemplate = useCreateNotificationTemplate(tenantId);

  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(notificationTemplateFormSchema),
    defaultValues: {
      code: '',
      name: '',
      channel: 'IN_APP',
      subjectTemplate: '',
      bodyTemplate: '',
    },
  });

  async function onSubmit(values: NotificationTemplateFormValues) {
    try {
      await createTemplate.mutateAsync(values);
      toast.success('Notification template created');
      form.reset({ code: '', name: '', channel: values.channel, subjectTemplate: '', bodyTemplate: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create notification template'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="LEAVE_APPROVED" className="w-44" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input className="w-48" {...field} />
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
          name="subjectTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject template</FormLabel>
              <FormControl>
                <Input placeholder="Your leave was approved" className="w-64" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bodyTemplate"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Body template</FormLabel>
              <FormControl>
                <Input placeholder="Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} was approved." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add template'}
        </Button>
      </form>
    </Form>
  );
}
