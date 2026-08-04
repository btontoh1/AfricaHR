'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useUpdateBenefitPlan } from './queries';
import {
  CONTRIBUTION_TYPE_OPTIONS,
  fromContributionRate,
  toContributionRate,
  updateBenefitPlanFormSchema,
  type UpdateBenefitPlanFormValues,
} from './benefits-form-schema';
import type { BenefitPlan } from './types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function EditBenefitPlanDialog({ tenantId, plan }: { tenantId: string; plan: BenefitPlan }) {
  const [open, setOpen] = useState(false);
  const updatePlan = useUpdateBenefitPlan(tenantId, plan.id);

  const form = useForm<UpdateBenefitPlanFormValues>({
    resolver: zodResolver(updateBenefitPlanFormSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description ?? '',
      contributionType: plan.contributionType,
      employeeContribution: fromContributionRate(Number(plan.employeeContribution), plan.contributionType),
      employerContribution: fromContributionRate(Number(plan.employerContribution), plan.contributionType),
    },
  });

  const contributionType = form.watch('contributionType');
  const isPercentage = contributionType === 'PERCENTAGE';

  async function onSubmit(values: UpdateBenefitPlanFormValues) {
    try {
      await updatePlan.mutateAsync({
        name: values.name,
        description: values.description ? values.description : undefined,
        contributionType: values.contributionType,
        employeeContribution: toContributionRate(values.employeeContribution, values.contributionType),
        employerContribution: toContributionRate(values.employerContribution, values.contributionType),
      });
      toast.success('Benefit plan updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update benefit plan'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {plan.name}</DialogTitle>
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
              name="contributionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTRIBUTION_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee rate {isPercentage ? '(%)' : '(flat amount)'}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={isPercentage ? '0.1' : '0.01'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employerContribution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer rate {isPercentage ? '(%)' : '(flat amount)'}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={isPercentage ? '0.1' : '0.01'} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
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
