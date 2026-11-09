'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeftRight } from 'lucide-react';
import { useTransferStock } from './queries';
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

const transferStockFormSchema = z
  .object({
    fromWarehouseId: z.string().min(1, 'Required'),
    toWarehouseId: z.string().min(1, 'Required'),
    productId: z.string().min(1, 'Required'),
    quantity: z.string().min(1, 'Required'),
    note: z.string().max(1000).optional(),
  })
  .refine((values) => values.fromWarehouseId !== values.toWarehouseId, {
    message: 'The two warehouses must be different',
    path: ['toWarehouseId'],
  })
  .refine((values) => Number(values.quantity) > 0, {
    message: 'Must be greater than zero',
    path: ['quantity'],
  });

type TransferStockFormValues = z.infer<typeof transferStockFormSchema>;

const emptyValues: TransferStockFormValues = {
  fromWarehouseId: '',
  toWarehouseId: '',
  productId: '',
  quantity: '',
  note: '',
};

export function TransferStockDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const transferStock = useTransferStock(tenantId);

  const form = useForm<TransferStockFormValues>({
    resolver: zodResolver(transferStockFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: TransferStockFormValues) {
    try {
      await transferStock.mutateAsync({
        fromWarehouseId: values.fromWarehouseId,
        toWarehouseId: values.toWarehouseId,
        productId: values.productId,
        quantity: Number(values.quantity),
        note: values.note || undefined,
      });
      toast.success('Stock transferred');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to transfer stock'));
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
        <Button variant="outline">
          <ArrowLeftRight className="size-4" />
          Transfer stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer stock</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="fromWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From warehouse</FormLabel>
                  <FormControl>
                    <WarehousePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toWarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To warehouse</FormLabel>
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
              name="note"
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
                {form.formState.isSubmitting ? 'Transferring…' : 'Transfer stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
