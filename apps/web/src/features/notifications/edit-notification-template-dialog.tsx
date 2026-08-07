'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateNotificationTemplate } from './queries';
import {
  editNotificationTemplateFormSchema,
  type EditNotificationTemplateFormValues,
} from './notifications-form-schema';
import type { NotificationTemplate } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function EditNotificationTemplateDialog({
  tenantId,
  template,
}: {
  tenantId: string;
  template: NotificationTemplate;
}) {
  const [open, setOpen] = useState(false);
  const updateTemplate = useUpdateNotificationTemplate(tenantId, template.id);

  const form = useForm<EditNotificationTemplateFormValues>({
    resolver: zodResolver(editNotificationTemplateFormSchema),
    defaultValues: {
      name: template.name,
      subjectTemplate: template.subjectTemplate,
      bodyTemplate: template.bodyTemplate,
    },
  });

  async function onSubmit(values: EditNotificationTemplateFormValues) {
    try {
      await updateTemplate.mutateAsync(values);
      toast.success('Template updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update notification template'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({
            name: template.name,
            subjectTemplate: template.subjectTemplate,
            bodyTemplate: template.bodyTemplate,
          });
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit template</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subjectTemplate"
              render={({ field }) => (
                <FormItem>
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
              name="bodyTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
