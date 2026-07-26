import { z } from 'zod';

// Mirrors UpsertPaymentMethodDto (libs/employee/feature/src/lib/dto/upsert-payment-method.dto.ts).
export const paymentMethodFormSchema = z
  .object({
    type: z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY']),
    bankName: z.string().optional().or(z.literal('')),
    accountNumber: z.string().optional().or(z.literal('')),
    accountName: z.string().optional().or(z.literal('')),
    mobileMoneyProvider: z.string().optional().or(z.literal('')),
    mobileMoneyNumber: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'BANK_ACCOUNT') {
      if (!values.bankName) {
        ctx.addIssue({ code: 'custom', path: ['bankName'], message: 'Bank name is required' });
      }
      if (!values.accountNumber) {
        ctx.addIssue({ code: 'custom', path: ['accountNumber'], message: 'Account number is required' });
      }
      if (!values.accountName) {
        ctx.addIssue({ code: 'custom', path: ['accountName'], message: 'Account name is required' });
      }
    } else {
      if (!values.mobileMoneyProvider) {
        ctx.addIssue({ code: 'custom', path: ['mobileMoneyProvider'], message: 'Provider is required' });
      }
      if (!values.mobileMoneyNumber) {
        ctx.addIssue({ code: 'custom', path: ['mobileMoneyNumber'], message: 'Mobile money number is required' });
      }
    }
  });

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;
