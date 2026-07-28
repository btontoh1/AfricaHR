'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useMfaDisable } from './queries';
import { mfaDisableFormSchema, type MfaDisableFormValues } from './mfa-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function MfaDisableDialog() {
  const [open, setOpen] = useState(false);
  const disable = useMfaDisable();

  const form = useForm<MfaDisableFormValues>({
    resolver: zodResolver(mfaDisableFormSchema),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: MfaDisableFormValues) {
    try {
      await disable.mutateAsync(values.password);
      toast.success('Two-factor authentication disabled');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to disable MFA'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Disable
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disable two-factor authentication</DialogTitle>
          <DialogDescription>
            This removes the extra sign-in step and deletes your backup codes. You&apos;ll be signed out of
            every other session.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Disabling…' : 'Disable'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
