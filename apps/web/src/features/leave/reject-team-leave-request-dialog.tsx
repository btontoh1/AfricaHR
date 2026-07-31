'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRejectTeamLeaveRequest } from './queries';
import {
  rejectLeaveRequestFormSchema,
  type RejectLeaveRequestFormValues,
} from './leave-form-schema';
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

export function RejectTeamLeaveRequestDialog({ tenantId, id }: { tenantId: string; id: string }) {
  const [open, setOpen] = useState(false);
  const rejectRequest = useRejectTeamLeaveRequest(tenantId);

  const form = useForm<RejectLeaveRequestFormValues>({
    resolver: zodResolver(rejectLeaveRequestFormSchema),
    defaultValues: { rejectionReason: '' },
  });

  async function onSubmit(values: RejectLeaveRequestFormValues) {
    try {
      await rejectRequest.mutateAsync({ id, rejectionReason: values.rejectionReason });
      toast.success('Leave request rejected');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reject leave request'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject leave request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Insufficient team coverage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Rejecting…' : 'Reject request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
