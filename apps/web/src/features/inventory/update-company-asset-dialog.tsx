'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateCompanyAsset } from './queries';
import type { CompanyAsset } from './types';
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

const updateFormSchema = z.object({
  name: z.string().min(1, 'Required').max(300),
  category: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchasePrice: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type UpdateFormValues = z.infer<typeof updateFormSchema>;

export function UpdateCompanyAssetDialog({ tenantId, asset }: { tenantId: string; asset: CompanyAsset }) {
  const [open, setOpen] = useState(false);
  const updateAsset = useUpdateCompanyAsset(tenantId);

  const defaultValues: UpdateFormValues = {
    name: asset.name,
    category: asset.category ?? '',
    serialNumber: asset.serialNumber ?? '',
    purchasePrice: asset.purchasePrice ?? '',
    notes: asset.notes ?? '',
  };

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateFormSchema),
    defaultValues,
  });

  async function onSubmit(values: UpdateFormValues) {
    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        name: values.name,
        category: values.category || undefined,
        serialNumber: values.serialNumber || undefined,
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
        notes: values.notes || undefined,
      });
      toast.success('Asset updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update asset'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset(defaultValues);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit &quot;{asset.assetTag}&quot;</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial number (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Purchase price (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
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
                {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
