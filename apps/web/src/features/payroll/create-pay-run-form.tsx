'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useCreatePayRun } from './queries';
import { payRunFormSchema, type PayRunFormValues } from './payroll-form-schema';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function CreatePayRunForm() {
  const router = useRouter();
  const session = useSession();
  const tenantId = session.tenantId as string;
  const createPayRun = useCreatePayRun(tenantId);

  const form = useForm<PayRunFormValues>({
    resolver: zodResolver(payRunFormSchema),
    defaultValues: { organizationId: '', periodStart: '', periodEnd: '', payDate: '' },
  });

  async function onSubmit(values: PayRunFormValues) {
    try {
      const payRun = await createPayRun.mutateAsync(values);
      toast.success('Pay run created');
      router.push(`/payroll/${payRun.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create pay run'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New pay run</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="periodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period end</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create pay run'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
