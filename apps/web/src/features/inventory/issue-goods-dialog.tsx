'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { PackageMinus } from 'lucide-react';
import { useInventoryProducts, useIssueGoods } from './queries';
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

const issueGoodsFormSchema = z.object({
  warehouseId: z.string().min(1, 'Required'),
  productId: z.string().min(1, 'Required'),
  quantity: z.string().refine((value) => Number(value) > 0, 'Must be greater than zero'),
  reason: z.string().min(1, 'A reason is required').max(1000),
});

type IssueGoodsFormValues = z.infer<typeof issueGoodsFormSchema>;

const emptyValues: IssueGoodsFormValues = { warehouseId: '', productId: '', quantity: '', reason: '' };

export function IssueGoodsDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const issueGoods = useIssueGoods(tenantId);
  const { data: products } = useInventoryProducts(tenantId);

  const form = useForm<IssueGoodsFormValues>({
    resolver: zodResolver(issueGoodsFormSchema),
    defaultValues: emptyValues,
  });

  const selectedProductId = form.watch('productId');
  const tracksBatch = products?.find((product) => product.id === selectedProductId)?.tracksBatch ?? false;

  async function onSubmit(values: IssueGoodsFormValues) {
    try {
      await issueGoods.mutateAsync({ ...values, quantity: Number(values.quantity) });
      toast.success('Goods issued');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to record goods issued'));
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
          <PackageMinus className="size-4" />
          Issue goods
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue goods</DialogTitle>
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
                  {tracksBatch && (
                    <p className="text-sm text-muted-foreground">
                      This product tracks batches - stock is drawn earliest-expiry-first automatically.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Why this stock is leaving the warehouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording…' : 'Issue goods'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
