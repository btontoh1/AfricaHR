'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useSubmitDemoRequest } from './queries';
import { demoRequestFormSchema, type DemoRequestFormValues } from './demo-request-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const EMPTY_VALUES: DemoRequestFormValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  organizationName: '',
  numberOfEmployees: '',
  preferredDate: '',
  preferredTime: '',
};

function DemoRequestForm({ onSuccess }: { onSuccess: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitDemoRequest = useSubmitDemoRequest();

  const form = useForm<DemoRequestFormValues>({
    resolver: zodResolver(demoRequestFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  async function onSubmit(values: DemoRequestFormValues) {
    setSubmitError(null);
    try {
      await submitDemoRequest.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber || undefined,
        organizationName: values.organizationName,
        numberOfEmployees: values.numberOfEmployees || undefined,
        preferredDate: values.preferredDate || undefined,
        preferredTime: values.preferredTime || undefined,
      });
      onSuccess();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Failed to submit your request'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfEmployees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of employees (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 1-50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="preferredTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred time (optional)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Submitting…' : 'Request demo'}
        </Button>
      </form>
    </Form>
  );
}

export function DemoRequestDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset after the close animation finishes rather than mid-close, so
      // the dialog doesn't visibly flash back to the form while fading out.
      setTimeout(() => setSubmitted(false), 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <h2 className="text-lg font-semibold">Request received</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Thanks for your interest in ParotHR. Our team will reach out shortly to schedule your demo.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book a demo</DialogTitle>
              <DialogDescription>
                Tell us about your business and we&apos;ll set up a session to walk you through ParotHR.
              </DialogDescription>
            </DialogHeader>
            <DemoRequestForm onSuccess={() => setSubmitted(true)} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
