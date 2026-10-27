import { z } from 'zod';

// Mirrors RequestWalletTopUpDto (libs/billing/feature/src/lib/dto/request-wallet-topup.dto.ts).
// amount is kept as a string in the form (HTML number inputs bind to
// react-hook-form as strings) and converted to a number at submission -
// same convention as assign-subscription-form-schema's pricePerEmployee.
export const requestTopUpFormSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO 4217 currency code'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((value) => Number(value) >= 1, 'Must be at least 1'),
});

export type RequestTopUpFormValues = z.infer<typeof requestTopUpFormSchema>;
