'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateCustomer } from './queries';
import { createCustomerFormSchema, type CreateCustomerFormValues } from './customer-form-schema';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
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

const EMPTY_VALUES: CreateCustomerFormValues = {
  organizationId: '',
  name: '',
  email: '',
  phone: '',
  billingAddress: '',
};

export function CreateCustomerDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const createCustomer = useCreateCustomer(tenantId);

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerFormSchema),
    defaultValues: { ...EMPTY_VALUES, organizationId: isOrgAdmin ? (session.organizationId ?? '') : '' },
  });

  async function onSubmit(values: CreateCustomerFormValues) {
    try {
      await createCustomer.mutateAsync({
        organizationId: values.organizationId,
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        billingAddress: values.billingAddress || undefined,
      });
      toast.success('Customer added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add customer'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({ ...EMPTY_VALUES, organizationId: isOrgAdmin ? (session.organizationId ?? '') : '' });
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker
                      tenantId={tenantId}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isOrgAdmin}
                    />
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
                    <FormLabel>Email (optional)</FormLabel>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing address (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding…' : 'Add customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
