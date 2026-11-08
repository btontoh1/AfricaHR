'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';
import { useImpersonateTenantUser } from './queries';
import type { User } from '@/features/iam/types';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const impersonateFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(
      10,
      'Give a specific reason - this is stored on the audit trail and sent to the user',
    )
    .max(500),
});

type ImpersonateFormValues = z.infer<typeof impersonateFormSchema>;

export function ImpersonateUserDialog({
  tenantId,
  user,
}: {
  tenantId: string;
  user: User;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const impersonate = useImpersonateTenantUser(tenantId);

  const form = useForm<ImpersonateFormValues>({
    resolver: zodResolver(impersonateFormSchema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: ImpersonateFormValues) {
    try {
      await impersonate.mutateAsync({ id: user.id, ...values });
      setOpen(false);
      form.reset();
      // A fresh identity is now in the ACCESS_TOKEN_COOKIE - router.refresh()
      // re-runs the (app) layout's getSession() so the banner and nav react
      // to it immediately, same as after login.
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to start impersonation'));
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
        <Button type="button" variant="outline" size="sm">
          <UserCog className="size-4" />
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            View as {user.firstName} {user.lastName}
          </DialogTitle>
          <DialogDescription>
            You&apos;ll see exactly what they see for the next 30 minutes,
            read-only - no payroll approvals, disbursements, deletions, or
            credential changes. {user.firstName} will be notified afterwards
            that support accessed their account and why.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Investigating payroll error #412 reported by the tenant"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Stored on the audit trail and included in the notice sent to{' '}
                    {user.firstName}.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Starting…'
                  : 'Start viewing as this user'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
