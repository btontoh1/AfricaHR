'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Undo2 } from 'lucide-react';
import { useReverseStockEntry } from './queries';
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

const reverseFormSchema = z.object({
  reason: z.string().min(1, 'A reason is required').max(1000),
});

type ReverseFormValues = z.infer<typeof reverseFormSchema>;

export function ReverseStockEntryDialog({ tenantId, entryId }: { tenantId: string; entryId: string }) {
  const [open, setOpen] = useState(false);
  const reverseEntry = useReverseStockEntry(tenantId);

  const form = useForm<ReverseFormValues>({
    resolver: zodResolver(reverseFormSchema),
    defaultValues: { reason: '' },
  });

  async function onSubmit(values: ReverseFormValues) {
    try {
      await reverseEntry.mutateAsync({ entryId, reason: values.reason });
      toast.success('Entry reversed');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reverse entry'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset({ reason: '' });
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Undo2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse this entry?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This posts an offsetting correction - the original entry is never edited or deleted.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Why this entry is being corrected" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Reversing…' : 'Reverse entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
