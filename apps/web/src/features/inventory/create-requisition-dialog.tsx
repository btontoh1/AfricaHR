'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCreateRequisition } from './queries';
import { WarehousePicker } from './warehouse-picker';
import { ProductPicker } from './product-picker';
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

const lineSchema = z.object({
  productId: z.string().min(1, 'Required'),
  quantity: z.string().refine((value) => Number(value) > 0, 'Must be greater than zero'),
  estimatedUnitCost: z.string().optional(),
});

const createRequisitionFormSchema = z.object({
  warehouseId: z.string().min(1, 'Required'),
  requestedByEmployeeId: z.string().min(1, 'Required'),
  notes: z.string().max(1000).optional(),
  lines: z.array(lineSchema).min(1, 'Add at least one line'),
});

type CreateRequisitionFormValues = z.infer<typeof createRequisitionFormSchema>;

const emptyValues: CreateRequisitionFormValues = {
  warehouseId: '',
  requestedByEmployeeId: '',
  notes: '',
  lines: [{ productId: '', quantity: '', estimatedUnitCost: '' }],
};

export function CreateRequisitionDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createRequisition = useCreateRequisition(tenantId);

  const form = useForm<CreateRequisitionFormValues>({
    resolver: zodResolver(createRequisitionFormSchema),
    defaultValues: emptyValues,
  });
  const lineFields = useFieldArray({ control: form.control, name: 'lines' });

  async function onSubmit(values: CreateRequisitionFormValues) {
    try {
      await createRequisition.mutateAsync({
        warehouseId: values.warehouseId,
        requestedByEmployeeId: values.requestedByEmployeeId,
        notes: values.notes || undefined,
        lines: values.lines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          estimatedUnitCost: line.estimatedUnitCost ? Number(line.estimatedUnitCost) : undefined,
        })),
      });
      toast.success('Requisition created');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create requisition'));
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
          New requisition
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New purchase requisition</DialogTitle>
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
              name="requestedByEmployeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested on behalf of</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-3">
              {lineFields.fields.map((field, index) => (
                <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_110px_130px_auto] sm:items-end">
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
                    name={`lines.${index}.estimatedUnitCost`}
                    render={({ field: costField }) => (
                      <FormItem>
                        {index === 0 && <FormLabel>Est. unit cost</FormLabel>}
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
                onClick={() => lineFields.append({ productId: '', quantity: '', estimatedUnitCost: '' })}
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
                {form.formState.isSubmitting ? 'Creating…' : 'Create requisition'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
