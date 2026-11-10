'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { PackagePlus } from 'lucide-react';
import { useInventoryProducts, useReceiveGoods } from './queries';
import { WarehousePicker } from './warehouse-picker';
import { ProductPicker } from './product-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { useQueryClient } from '@tanstack/react-query';
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

const receiveGoodsFormSchema = z.object({
  warehouseId: z.string().min(1, 'Required'),
  productId: z.string().min(1, 'Required'),
  quantity: z.string().refine((value) => Number(value) > 0, 'Must be greater than zero'),
  unitCost: z.string().optional(),
  referenceId: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  manufactureDate: z.string().optional(),
});

type ReceiveGoodsFormValues = z.infer<typeof receiveGoodsFormSchema>;

const emptyValues: ReceiveGoodsFormValues = {
  warehouseId: '',
  productId: '',
  quantity: '',
  unitCost: '',
  referenceId: '',
  note: '',
  batchNumber: '',
  expiryDate: '',
  manufactureDate: '',
};

export function ReceiveGoodsDialog({
  tenantId,
  purchaseOrderLineId,
  presetWarehouseId,
  presetProductId,
  trigger,
}: {
  tenantId: string;
  /** Scopes this receipt to a specific PO line - advances its quantityReceived and the PO's status. */
  purchaseOrderLineId?: string;
  presetWarehouseId?: string;
  presetProductId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const receiveGoods = useReceiveGoods(tenantId);
  const queryClient = useQueryClient();
  const { data: products } = useInventoryProducts(tenantId);

  const scoped = Boolean(purchaseOrderLineId);
  const scopedValues: ReceiveGoodsFormValues = {
    ...emptyValues,
    warehouseId: presetWarehouseId ?? '',
    productId: presetProductId ?? '',
  };

  const form = useForm<ReceiveGoodsFormValues>({
    resolver: zodResolver(receiveGoodsFormSchema),
    defaultValues: scoped ? scopedValues : emptyValues,
  });

  const selectedProductId = form.watch('productId');
  const tracksBatch = products?.find((product) => product.id === selectedProductId)?.tracksBatch ?? false;

  async function onSubmit(values: ReceiveGoodsFormValues) {
    if (tracksBatch && (!values.batchNumber || !values.expiryDate)) {
      if (!values.batchNumber) form.setError('batchNumber', { message: 'Required for a batch-tracked product' });
      if (!values.expiryDate) form.setError('expiryDate', { message: 'Required for a batch-tracked product' });
      return;
    }

    try {
      await receiveGoods.mutateAsync({
        warehouseId: values.warehouseId,
        productId: values.productId,
        quantity: Number(values.quantity),
        unitCost: values.unitCost ? Number(values.unitCost) : undefined,
        referenceId: values.referenceId || undefined,
        note: values.note || undefined,
        batchNumber: tracksBatch ? values.batchNumber : undefined,
        expiryDate: tracksBatch ? values.expiryDate : undefined,
        manufactureDate: tracksBatch && values.manufactureDate ? values.manufactureDate : undefined,
        purchaseOrderLineId,
      });
      if (purchaseOrderLineId) {
        queryClient.invalidateQueries({ queryKey: ['inventory', 'purchase-orders', tenantId] });
      }
      toast.success('Goods received');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to record goods received'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset(scoped ? scopedValues : emptyValues);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PackagePlus className="size-4" />
            Receive goods
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive goods</DialogTitle>
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
                    <WarehousePicker tenantId={tenantId} value={field.value} onChange={field.onChange} disabled={scoped} />
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
                    <ProductPicker tenantId={tenantId} value={field.value} onChange={field.onChange} disabled={scoped} />
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
            {tracksBatch && (
              <>
                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch / lot number</FormLabel>
                      <FormControl>
                        <Input placeholder="LOT-0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufactureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacture date (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit cost (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Supplier delivery note / invoice number" {...field} />
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
                {form.formState.isSubmitting ? 'Recording…' : 'Receive goods'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
