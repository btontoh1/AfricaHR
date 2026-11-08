'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateLeaveRequest } from './queries';
import {
  editLeaveRequestFormSchema,
  type EditLeaveRequestFormValues,
} from './leave-form-schema';
import type { LeaveRequest } from './types';
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

export function EditLeaveRequestDialog({ tenantId, request }: { tenantId: string; request: LeaveRequest }) {
  const [open, setOpen] = useState(false);
  const updateRequest = useUpdateLeaveRequest(tenantId);

  const form = useForm<EditLeaveRequestFormValues>({
    resolver: zodResolver(editLeaveRequestFormSchema),
    defaultValues: {
      startDate: request.startDate.slice(0, 10),
      endDate: request.endDate.slice(0, 10),
      reason: request.reason ?? '',
    },
  });

  async function onSubmit(values: EditLeaveRequestFormValues) {
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        input: {
          startDate: values.startDate,
          endDate: values.endDate,
          reason: values.reason || undefined,
        },
      });
      toast.success('Leave request updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update leave request'));
    }
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      form.reset({
        startDate: request.startDate.slice(0, 10),
        endDate: request.endDate.slice(0, 10),
        reason: request.reason ?? '',
      });
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit leave request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
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
