'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCandidate, useUpdateCandidate } from './queries';
import {
  updateCandidateFormSchema,
  type UpdateCandidateFormValues,
} from './recruitment-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

export function CandidateDetail({ tenantId, candidateId }: { tenantId: string; candidateId: string }) {
  const { data: candidate, isLoading, isError, error } = useCandidate(tenantId, candidateId);
  const updateCandidate = useUpdateCandidate(tenantId, candidateId);

  const form = useForm<UpdateCandidateFormValues>({
    resolver: zodResolver(updateCandidateFormSchema),
    values: candidate
      ? {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone ?? '',
          source: candidate.source ?? '',
        }
      : undefined,
  });

  async function onSubmit(values: UpdateCandidateFormValues) {
    try {
      await updateCandidate.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone ? values.phone : undefined,
        source: values.source ? values.source : undefined,
      });
      toast.success('Candidate updated');
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, 'Failed to update candidate'));
    }
  }

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !candidate) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load candidate')} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`${candidate.firstName} ${candidate.lastName}`} />

      <Card>
        <CardHeader>
          <CardTitle>Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
