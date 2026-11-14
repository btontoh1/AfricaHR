'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSetDisbursementFee } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const setDisbursementFeeFormSchema = z.object({
  disbursementFeeAmount: z.string().min(1, 'Fee is required'),
});

type SetDisbursementFeeFormValues = z.infer<typeof setDisbursementFeeFormSchema>;

export function SetDisbursementFeeDialog({
  tenantId,
  currency,
  currentFeeAmount,
  open,
  onOpenChange,
}: {
  tenantId: string;
  currency: string;
  currentFeeAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setDisbursementFee = useSetDisbursementFee(tenantId);

  const form = useForm<SetDisbursementFeeFormValues>({
    resolver: zodResolver(setDisbursementFeeFormSchema),
    values: { disbursementFeeAmount: String(currentFeeAmount) },
  });

  async function onSubmit(values: SetDisbursementFeeFormValues) {
    try {
      await setDisbursementFee.mutateAsync({ disbursementFeeAmount: Number(values.disbursementFeeAmount) });
      toast.success('Disbursement margin saved');
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save disbursement margin'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set payroll disbursement margin</DialogTitle>
          <DialogDescription>
            ParotHR&apos;s own flat margin charged per payroll disbursement transaction for this
            tenant, in {currency}, on top of Paystack&apos;s real transfer cost (set platform-wide
            under Paystack Fees). 0 charges no margin.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="disbursementFeeAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margin per transaction ({currency})</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save margin'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
