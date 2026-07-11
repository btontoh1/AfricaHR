'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNotificationTemplates, useSendFromTemplate } from './queries';
import {
  sendFromTemplateFormSchema,
  type SendFromTemplateFormValues,
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

export function SendFromTemplateForm({ tenantId }: { tenantId: string }) {
  const { data: templates } = useNotificationTemplates(tenantId, true);
  const sendFromTemplate = useSendFromTemplate(tenantId);

  const form = useForm<SendFromTemplateFormValues>({
    resolver: zodResolver(sendFromTemplateFormSchema),
    defaultValues: { userId: '', templateId: '', variables: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'variables' });

  async function onSubmit(values: SendFromTemplateFormValues) {
    try {
      const variables = Object.fromEntries(
        values.variables.filter((row) => row.key).map((row) => [row.key, row.value]),
      );
      await sendFromTemplate.mutateAsync({
        userId: values.userId,
        templateId: values.templateId,
        variables,
      });
      toast.success('Notification sent from template');
      form.reset({ userId: '', templateId: values.templateId, variables: [] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send notification from template'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send from a template</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
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
                name="templateId"
                render={({ field }) => (
                  <FormItem className="w-64">
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Variables</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`variables.${index}.key`}
                    render={({ field: keyField }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="firstName" className="w-40" {...keyField} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variables.${index}.value`}
                    render={({ field: valueField }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Ama" className="w-40" {...valueField} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ key: '', value: '' })}
              >
                Add variable
              </Button>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Sending…' : 'Send'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
