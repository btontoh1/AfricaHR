'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCreatePurchaseOrder } from './queries';
import { WarehousePicker } from './warehouse-picker';
import { VendorPicker } from './vendor-picker';
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

const lineSchema = z.object({
  productId: z.string().min(1, 'Required'),
  quantity: z.string().refine((value) => Number(value) > 0, 'Must be greater than zero'),
  unitCost: z.string().refine((value) => Number(value) >= 0, 'Required'),
});

const createPoFormSchema = z.object({
  warehouseId: z.string().min(1, 'Required'),
  vendorId: z.string().min(1, 'Required'),
  poNumber: z.string().min(1, 'Required').max(50),
  expectedDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  lines: z.array(lineSchema).min(1, 'Add at least one line'),
});

type CreatePoFormValues = z.infer<typeof createPoFormSchema>;

const emptyValues: CreatePoFormValues = {
  warehouseId: '',
  vendorId: '',
  poNumber: '',
  expectedDate: '',
  notes: '',
  lines: [{ productId: '', quantity: '', unitCost: '' }],
};

export function CreatePurchaseOrderDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createPo = useCreatePurchaseOrder(tenantId);

  const form = useForm<CreatePoFormValues>({
    resolver: zodResolver(createPoFormSchema),
    defaultValues: emptyValues,
  });
  const lineFields = useFieldArray({ control: form.control, name: 'lines' });

  async function onSubmit(values: CreatePoFormValues) {
    try {
      await createPo.mutateAsync({
        warehouseId: values.warehouseId,
        vendorId: values.vendorId,
        poNumber: values.poNumber,
        expectedDate: values.expectedDate || undefined,
        notes: values.notes || undefined,
        lines: values.lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
        })),
      });
      toast.success('Purchase order created');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create purchase order'));
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
          New purchase order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <div className="space-y-3">
              {lineFields.fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_110px_110px_auto] sm:items-end">
                  <FormField
                    control={form.control}
                    name={`lines.${index}.productId`}
                    render={({ field: productField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Product</FormLabel>}
                        <FormControl>
                          <ProductPicker tenantId={tenantId} value={productField.value} onChange={productField.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.quantity`}
                    render={({ field: quantityField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Quantity</FormLabel>}
                        <FormControl>
                          <Input type="number" step="any" {...quantityField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`lines.${index}.unitCost`}
                    render={({ field: costField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Unit cost</FormLabel>}
                        <FormControl>
                          <Input type="number" step="any" {...costField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => lineFields.remove(index)}
                    disabled={lineFields.fields.length <= 1}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => lineFields.append({ productId: '', quantity: '', unitCost: '' })}
              >
                <Plus className="size-4" />
                Add line
              </Button>
            </div>
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
                {form.formState.isSubmitting ? 'Creating…' : 'Create purchase order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
