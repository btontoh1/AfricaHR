'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateOrganizationUnit } from './queries';
import {
  editOrganizationUnitFormSchema,
  type EditOrganizationUnitFormValues,
} from './organization-form-schema';
import type { OrganizationUnit } from './types';
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

export function EditOrganizationUnitDialog({
  tenantId,
  organizationId,
  unit,
}: {
  tenantId: string;
  organizationId: string;
  unit: OrganizationUnit;
}) {
  const [open, setOpen] = useState(false);
  const updateUnit = useUpdateOrganizationUnit(tenantId, organizationId, unit.id);

  const form = useForm<EditOrganizationUnitFormValues>({
    resolver: zodResolver(editOrganizationUnitFormSchema),
    defaultValues: { name: unit.name, code: unit.code },
  });

  async function onSubmit(values: EditOrganizationUnitFormValues) {
    try {
      await updateUnit.mutateAsync(values);
      toast.success('Unit updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update unit'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({ name: unit.name, code: unit.code });
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
          <DialogTitle>Edit unit</DialogTitle>
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
                    <Input placeholder="Human Resources" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="HR" {...field} />
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
