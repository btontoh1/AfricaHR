'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInventoryProduct } from './queries';
import { UnitPicker } from './unit-picker';
import { CategoryPicker } from './category-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const createProductFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100),
  name: z.string().min(1, 'Name is required').max(300),
  baseUnitId: z.string().min(1, 'Base unit is required'),
  categoryId: z.string().optional(),
  purchasePrice: z.string().refine((value) => Number(value) >= 0, 'Must be zero or more'),
  sellingPrice: z.string().optional(),
  tracksBatch: z.boolean(),
});

type CreateProductFormValues = z.infer<typeof createProductFormSchema>;

const emptyValues: CreateProductFormValues = {
  sku: '',
  name: '',
  baseUnitId: '',
  categoryId: '',
  purchasePrice: '',
  sellingPrice: '',
  tracksBatch: false,
};

export function CreateProductDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createProduct = useCreateInventoryProduct(tenantId);

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateProductFormValues) {
    try {
      await createProduct.mutateAsync({
        sku: values.sku,
        name: values.name,
        baseUnitId: values.baseUnitId,
        categoryId: values.categoryId || undefined,
        purchasePrice: Number(values.purchasePrice),
        sellingPrice: values.sellingPrice ? Number(values.sellingPrice) : undefined,
        tracksBatch: values.tracksBatch,
      });
      toast.success('Product added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add product'));
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
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="PARA-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Paracetamol 500mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base unit</FormLabel>
                  <FormControl>
                    <UnitPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (optional)</FormLabel>
                  <FormControl>
                    <CategoryPicker tenantId={tenantId} value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase price</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="2.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling price (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="3.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tracksBatch"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 pb-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Tracks batches/expiry (pharmaceuticals, perishables)
                  </FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding…' : 'Add product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
