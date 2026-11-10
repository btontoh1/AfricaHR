'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAssignAsset } from './queries';
import { EmployeePicker } from '@/features/employees/employee-picker';
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

const assignFormSchema = z.object({
  employeeId: z.string().min(1, 'Required'),
  assignNote: z.string().max(500).optional(),
});

type AssignFormValues = z.infer<typeof assignFormSchema>;

const emptyValues: AssignFormValues = { employeeId: '', assignNote: '' };

export function AssignAssetDialog({ tenantId, id }: { tenantId: string; id: string }) {
  const [open, setOpen] = useState(false);
  const assignAsset = useAssignAsset(tenantId);

  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: AssignFormValues) {
    try {
      await assignAsset.mutateAsync({
        id,
        input: { employeeId: values.employeeId, assignNote: values.assignNote || undefined },
      });
      toast.success('Asset assigned');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to assign asset'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset(emptyValues);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Assign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign asset</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Assigning…' : 'Assign asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
