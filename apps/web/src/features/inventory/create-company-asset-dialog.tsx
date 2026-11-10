'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateCompanyAsset } from './queries';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
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
  organizationId: z.string().min(1, 'Required'),
  assetTag: z.string().min(1, 'Required').max(100),
  name: z.string().min(1, 'Required').max(300),
  category: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

export function CreateCompanyAssetDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const createAsset = useCreateCompanyAsset(tenantId);

  const emptyValues: CreateFormValues = {
    organizationId: isOrgAdmin ? (session.organizationId ?? '') : '',
    assetTag: '',
    name: '',
    category: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    notes: '',
  };

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateFormValues) {
    try {
      await createAsset.mutateAsync({
        organizationId: values.organizationId,
        assetTag: values.assetTag,
        name: values.name,
        category: values.category || undefined,
        serialNumber: values.serialNumber || undefined,
        purchaseDate: values.purchaseDate || undefined,
        purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
        notes: values.notes || undefined,
      });
      toast.success('Asset added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add asset'));
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
          Add asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add company asset</DialogTitle>
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
                    <OrganizationPicker
                      tenantId={tenantId}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isOrgAdmin}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assetTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset tag</FormLabel>
                  <FormControl>
                    <Input placeholder="LAPTOP-001" {...field} />
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
                    <Input placeholder="MacBook Pro 14&quot;" {...field} />
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
                    <Input placeholder="Laptops" {...field} />
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
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {form.formState.isSubmitting ? 'Adding…' : 'Add asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
