'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateMyStockRequest } from './queries';
import { WarehousePicker } from './warehouse-picker';
import { ProductPicker } from './product-picker';
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

const createFormSchema = z.object({
  warehouseId: z.string().min(1, 'Required'),
  productId: z.string().min(1, 'Required'),
  quantity: z.string().refine((value) => Number(value) > 0, 'Must be greater than zero'),
  reason: z.string().max(500).optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

const emptyValues: CreateFormValues = { warehouseId: '', productId: '', quantity: '', reason: '' };

export function CreateMyStockRequestDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createRequest = useCreateMyStockRequest(tenantId);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateFormValues) {
    try {
      await createRequest.mutateAsync({
        warehouseId: values.warehouseId,
        productId: values.productId,
        quantity: Number(values.quantity),
        reason: values.reason || undefined,
      });
      toast.success('Stock request submitted');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit stock request'));
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
        <Button>
          <Plus className="size-4" />
          New request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request stock</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <FormControl>
                    <WarehousePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <FormControl>
                    <ProductPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting…' : 'Submit request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
