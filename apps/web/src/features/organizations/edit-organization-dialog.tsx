'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateOrganization } from './queries';
import { organizationFormSchema, type OrganizationFormValues } from './organization-form-schema';
import type { Organization } from './types';
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

function toOptional(value: string | undefined): string | undefined {
  return value ? value : undefined;
}

export function EditOrganizationDialog({
  tenantId,
  organization,
}: {
  tenantId: string;
  organization: Organization;
}) {
  const [open, setOpen] = useState(false);
  const updateOrganization = useUpdateOrganization(tenantId, organization.id);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      legalName: organization.legalName,
      tradingName: organization.tradingName ?? '',
      countryCode: organization.countryCode,
      registrationNumber: organization.registrationNumber,
      taxIdentificationNumber: organization.taxIdentificationNumber ?? '',
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    try {
      await updateOrganization.mutateAsync({
        legalName: values.legalName,
        tradingName: toOptional(values.tradingName),
        countryCode: values.countryCode,
        registrationNumber: values.registrationNumber,
        taxIdentificationNumber: toOptional(values.taxIdentificationNumber),
      });
      toast.success('Organization updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update organization'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({
            legalName: organization.legalName,
            tradingName: organization.tradingName ?? '',
            countryCode: organization.countryCode,
            registrationNumber: organization.registrationNumber,
            taxIdentificationNumber: organization.taxIdentificationNumber ?? '',
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
          <DialogTitle>Edit organization</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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
