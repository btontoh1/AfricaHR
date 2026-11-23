'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ShieldPlus } from 'lucide-react';
import { useCreatePlatformAdmin } from './queries';
import { addPlatformAdminFormSchema, type AddPlatformAdminFormValues } from './add-platform-admin-form-schema';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PASSWORD_REQUIREMENTS_TEXT } from '@/lib/password-schema';

export function AddPlatformAdminDialog() {
  const [open, setOpen] = useState(false);
  const createPlatformAdmin = useCreatePlatformAdmin();

  const form = useForm<AddPlatformAdminFormValues>({
    resolver: zodResolver(addPlatformAdminFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  async function onSubmit(values: AddPlatformAdminFormValues) {
    try {
      await createPlatformAdmin.mutateAsync(values);
      toast.success('Platform admin created');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create platform admin'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <ShieldPlus className="size-4" />
          Add platform admin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a platform admin</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This account gets the same full access as every other platform admin, across every tenant - there is no
          narrower role. Only add people who should have that.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
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
                      <Input autoComplete="family-name" {...field} />
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
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>{PASSWORD_REQUIREMENTS_TEXT}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating…' : 'Create platform admin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
