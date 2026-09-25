'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateFixedAsset } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const createFixedAssetFormSchema = z
  .object({
    organizationId: z.string().min(1, 'Organization is required'),
    description: z.string().min(1, 'Description is required').max(500),
    currency: z.string().length(3, 'Use a 3-letter currency code (e.g. USD)'),
    cost: z.string().min(1, 'Cost is required'),
    salvageValue: z.string(),
    usefulLifeMonths: z.string().min(1, 'Useful life is required'),
    acquisitionDate: z.string().min(1, 'Date is required'),
  })
  .refine((values) => Number(values.salvageValue || 0) < Number(values.cost), {
    message: 'Salvage value must be less than cost',
    path: ['salvageValue'],
  });

type CreateFixedAssetFormValues = z.infer<typeof createFixedAssetFormSchema>;

export function CreateFixedAssetDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createFixedAsset = useCreateFixedAsset(tenantId);

  const emptyValues: CreateFixedAssetFormValues = {
    organizationId: '',
    description: '',
    currency: '',
    cost: '',
    salvageValue: '0',
    usefulLifeMonths: '',
    acquisitionDate: new Date().toISOString().slice(0, 10),
  };

  const form = useForm<CreateFixedAssetFormValues>({
    resolver: zodResolver(createFixedAssetFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateFixedAssetFormValues) {
    try {
      await createFixedAsset.mutateAsync({
        organizationId: values.organizationId,
        description: values.description,
        currency: values.currency,
        cost: Number(values.cost),
        salvageValue: Number(values.salvageValue || 0),
        usefulLifeMonths: Number(values.usefulLifeMonths),
        acquisitionDate: values.acquisitionDate,
      });
      toast.success('Fixed asset added - acquisition entry posted');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add fixed asset'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset(emptyValues);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add fixed asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a fixed asset</DialogTitle>
          <DialogDescription>
            Posts Dr Fixed Assets / Cr Cash and Bank for the cost immediately. Depreciation is
            straight-line, spread evenly across the useful life, and is posted separately whenever you
            run depreciation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Delivery van" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.code} — {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acquisitionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Acquisition date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.01} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salvageValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salvage value</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usefulLifeMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Useful life (months)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding…' : 'Add fixed asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
