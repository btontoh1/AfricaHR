'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInventoryUnitConversion } from './queries';
import { UnitPicker } from './unit-picker';
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

const createConversionFormSchema = z
  .object({
    fromUnitId: z.string().min(1, 'Required'),
    toUnitId: z.string().min(1, 'Required'),
    factor: z.string().min(1, 'Required'),
  })
  .refine((values) => values.fromUnitId !== values.toUnitId, {
    message: 'The two units must be different',
    path: ['toUnitId'],
  })
  .refine((values) => Number(values.factor) > 0, {
    message: 'Must be greater than zero',
    path: ['factor'],
  });

type CreateConversionFormValues = z.infer<typeof createConversionFormSchema>;

const emptyValues: CreateConversionFormValues = { fromUnitId: '', toUnitId: '', factor: '' };

export function CreateUnitConversionDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createConversion = useCreateInventoryUnitConversion(tenantId);

  const form = useForm<CreateConversionFormValues>({
    resolver: zodResolver(createConversionFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateConversionFormValues) {
    try {
      await createConversion.mutateAsync({ ...values, factor: Number(values.factor) });
      toast.success('Conversion added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add conversion'));
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
          <Plus className="size-4" />
          Add conversion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add unit conversion</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="fromUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Larger unit</FormLabel>
                  <FormControl>
                    <UnitPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toUnitId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Smaller unit</FormLabel>
                  <FormControl>
                    <UnitPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="factor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factor (1 larger unit = factor × smaller unit)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding…' : 'Add conversion'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
