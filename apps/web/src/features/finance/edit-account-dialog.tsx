'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRenameAccount } from './queries';
import type { GlAccount } from './types';
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

const editAccountFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

type EditAccountFormValues = z.infer<typeof editAccountFormSchema>;

export function EditAccountDialog({ tenantId, account }: { tenantId: string; account: GlAccount }) {
  const [open, setOpen] = useState(false);
  const renameAccount = useRenameAccount(tenantId, account.id);

  const form = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: { name: account.name },
  });

  async function onSubmit(values: EditAccountFormValues) {
    try {
      await renameAccount.mutateAsync({ name: values.name });
      toast.success('Account renamed');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to rename account'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({ name: account.name });
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
          <DialogTitle>Rename account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Account {account.code} — only the display name can change; the code and type are fixed so
          automatic postings from payroll and invoicing are never affected.
        </p>
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
