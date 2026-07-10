'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEnrollInBenefitPlan } from './queries';
import { selfEnrollFormSchema, type SelfEnrollFormValues } from './benefits-form-schema';
import { BenefitPlanPicker } from './benefit-plan-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function EnrollForm({ tenantId }: { tenantId: string }) {
  const enroll = useEnrollInBenefitPlan(tenantId);

  const form = useForm<SelfEnrollFormValues>({
    resolver: zodResolver(selfEnrollFormSchema),
    defaultValues: { benefitPlanId: '' },
  });

  async function onSubmit(values: SelfEnrollFormValues) {
    try {
      await enroll.mutateAsync({ benefitPlanId: values.benefitPlanId });
      toast.success('Enrolled');
      form.reset({ benefitPlanId: '' });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to enroll'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="benefitPlanId"
          render={({ field }) => (
            <FormItem className="w-64">
              <FormLabel>Enroll in a plan</FormLabel>
              <FormControl>
                <BenefitPlanPicker tenantId={tenantId} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Enrolling…' : 'Enroll'}
        </Button>
      </form>
    </Form>
  );
}
