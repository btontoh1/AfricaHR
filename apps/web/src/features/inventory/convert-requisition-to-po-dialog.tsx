'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useConvertRequisitionToPo } from './queries';
import { VendorPicker } from './vendor-picker';
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

const convertFormSchema = z.object({
  vendorId: z.string().min(1, 'Required'),
  poNumber: z.string().min(1, 'Required').max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type ConvertFormValues = z.infer<typeof convertFormSchema>;

const emptyValues: ConvertFormValues = { vendorId: '', poNumber: '', expectedDate: '', notes: '' };

export function ConvertRequisitionToPoDialog({ tenantId, id }: { tenantId: string; id: string }) {
  const [open, setOpen] = useState(false);
  const convert = useConvertRequisitionToPo(tenantId);

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: ConvertFormValues) {
    try {
      await convert.mutateAsync({
        id,
        input: {
          vendorId: values.vendorId,
          poNumber: values.poNumber,
          expectedDate: values.expectedDate || undefined,
          notes: values.notes || undefined,
        },
      });
      toast.success('Converted to purchase order');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to convert requisition'));
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
        <Button size="sm">Convert to PO</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to purchase order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <VendorPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PO number</FormLabel>
                  <FormControl>
                    <Input placeholder="PO-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Converting…' : 'Convert to purchase order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
