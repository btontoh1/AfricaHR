'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { useCreateInventoryCategory } from './queries';
import { CategoryPicker } from './category-picker';
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

const createCategoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  parentId: z.string().optional(),
});

type CreateCategoryFormValues = z.infer<typeof createCategoryFormSchema>;

const emptyValues: CreateCategoryFormValues = { name: '', parentId: '' };

export function CreateCategoryDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createCategory = useCreateInventoryCategory(tenantId);

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: emptyValues,
  });

  async function onSubmit(values: CreateCategoryFormValues) {
    try {
      await createCategory.mutateAsync({ name: values.name, parentId: values.parentId || undefined });
      toast.success('Category added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add category'));
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
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
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
                    <Input placeholder="Pharmaceuticals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category (optional)</FormLabel>
                  <FormControl>
                    <CategoryPicker tenantId={tenantId} value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding…' : 'Add category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
