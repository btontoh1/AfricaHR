'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useSubmitPublicApplication } from './queries';
import { publicApplicationFormSchema, type PublicApplicationFormValues } from './careers-form-schema';
import type { PublicJobRequisition } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function PublicApplicationForm({ requisition }: { requisition: PublicJobRequisition }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitApplication = useSubmitPublicApplication(requisition.id);

  const form = useForm<PublicApplicationFormValues>({
    resolver: zodResolver(publicApplicationFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  async function onSubmit(values: PublicApplicationFormValues) {
    setSubmitError(null);
    try {
      await submitApplication.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone ? values.phone : undefined,
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Failed to submit your application'));
    }
  }

  if (submitApplication.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="text-lg font-semibold">Application received</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks for applying to <span className="font-medium">{requisition.title}</span>. The hiring team
            will review your application and reach out if there&apos;s a match.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this role</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
