import { z } from 'zod';

// Mirrors CreatePayRunDto (libs/payroll/feature/src/lib/dto/create-pay-run.dto.ts).
export const payRunFormSchema = z.object({
  organizationId: z.string().uuid('Select an organization'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  payDate: z.string().min(1, 'Pay date is required'),
});

export type PayRunFormValues = z.infer<typeof payRunFormSchema>;

const LINE_ITEM_TYPES = ['EARNING', 'DEDUCTION'] as const;

// Mirrors CreatePayslipLineItemDto (libs/payroll/feature/src/lib/dto/create-payslip-line-item.dto.ts).
export const payslipLineItemFormSchema = z.object({
  type: z.enum(LINE_ITEM_TYPES),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().max(500).optional().or(z.literal('')),
  amount: z.string().min(1, 'Amount is required'),
});

export type PayslipLineItemFormValues = z.infer<typeof payslipLineItemFormSchema>;

export const LINE_ITEM_TYPE_OPTIONS = LINE_ITEM_TYPES;
