'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateBenefitPlan } from './queries';
import {
  benefitPlanFormSchema,
  CONTRIBUTION_TYPE_OPTIONS,
  type BenefitPlanFormValues,
} from './benefits-form-schema';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreateBenefitPlanForm({ tenantId }: { tenantId: string }) {
  const createPlan = useCreateBenefitPlan(tenantId);

  const form = useForm<BenefitPlanFormValues>({
    resolver: zodResolver(benefitPlanFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      contributionType: 'PERCENTAGE',
      employeeContribution: '',
      employerContribution: '',
    },
  });

  async function onSubmit(values: BenefitPlanFormValues) {
    try {
      await createPlan.mutateAsync({
        name: values.name,
        code: values.code,
        description: values.description ? values.description : undefined,
        contributionType: values.contributionType,
        employeeContribution: Number(values.employeeContribution),
        employerContribution: Number(values.employerContribution),
      });
      toast.success('Benefit plan created');
      form.reset({
        name: '',
        code: '',
        description: '',
        contributionType: values.contributionType,
        employeeContribution: '',
        employerContribution: '',
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create benefit plan'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Private Health Insurance" className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input placeholder="HEALTH" className="w-32" {...field} />
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
                  <SelectTrigger className="w-36">
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
        <FormField
          control={form.control}
          name="employeeContribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee rate</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.001" className="w-28" {...field} />
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
              <FormLabel>Employer rate</FormLabel>
              <FormControl>
                <Input type="number" min={0} step="0.001" className="w-28" {...field} />
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
                <Input placeholder="Optional" className="w-56" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Adding…' : 'Add plan'}
        </Button>
      </form>
    </Form>
  );
}
