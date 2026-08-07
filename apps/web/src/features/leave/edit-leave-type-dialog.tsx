'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateLeaveType } from './queries';
import { editLeaveTypeFormSchema, type EditLeaveTypeFormValues } from './leave-form-schema';
import type { LeaveType } from './types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function EditLeaveTypeDialog({ tenantId, leaveType }: { tenantId: string; leaveType: LeaveType }) {
  const [open, setOpen] = useState(false);
  const updateLeaveType = useUpdateLeaveType(tenantId, leaveType.id);

  const form = useForm<EditLeaveTypeFormValues>({
    resolver: zodResolver(editLeaveTypeFormSchema),
    defaultValues: {
      name: leaveType.name,
      isPaid: leaveType.isPaid,
      defaultEntitlementDays: String(leaveType.defaultEntitlementDays),
    },
  });

  async function onSubmit(values: EditLeaveTypeFormValues) {
    try {
      await updateLeaveType.mutateAsync({
        name: values.name,
        isPaid: values.isPaid,
        defaultEntitlementDays: Number(values.defaultEntitlementDays),
      });
      toast.success('Leave type updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update leave type'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({
            name: leaveType.name,
            isPaid: leaveType.isPaid,
            defaultEntitlementDays: String(leaveType.defaultEntitlementDays),
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
          <DialogTitle>Edit leave type</DialogTitle>
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
                    <Input placeholder="Annual Leave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultEntitlementDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Days/year</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Paid</FormLabel>
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
