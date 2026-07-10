'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateOrganization } from './queries';
import { organizationFormSchema, type OrganizationFormValues } from './organization-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function toOptional(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const session = useSession();
  const tenantId = session.tenantId as string;
  const createOrganization = useCreateOrganization(tenantId);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      legalName: '',
      tradingName: '',
      countryCode: '',
      registrationNumber: '',
      taxIdentificationNumber: '',
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    try {
      const organization = await createOrganization.mutateAsync({
        legalName: values.legalName,
        tradingName: toOptional(values.tradingName),
        countryCode: values.countryCode,
        registrationNumber: values.registrationNumber,
        taxIdentificationNumber: toOptional(values.taxIdentificationNumber),
      });
      toast.success('Organization created');
      router.push(`/organizations/${organization.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create organization'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Ghana Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tradingName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trading name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country code</FormLabel>
                  <FormControl>
                    <Input placeholder="GH" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration number</FormLabel>
                  <FormControl>
                    <Input placeholder="BN-12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxIdentificationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax identification number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="C0012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating…' : 'Create organization'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
