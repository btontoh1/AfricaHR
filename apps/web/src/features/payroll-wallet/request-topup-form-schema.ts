import { z } from 'zod';

// Mirrors RequestWalletTopUpDto (libs/billing/feature/src/lib/dto/request-wallet-topup.dto.ts),
// minus currency - the backend now rejects any currency other than the
// tenant's own operating currency (TenantPayrollWalletService.requestTopUp),
// so the dialog fixes it to that value instead of asking for it. amount is
// kept as a string in the form (HTML number inputs bind to react-hook-form
// as strings) and converted to a number at submission - same convention as
// assign-subscription-form-schema's pricePerEmployee.
export const requestTopUpFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((value) => Number(value) >= 1, 'Must be at least 1'),
});

export type RequestTopUpFormValues = z.infer<typeof requestTopUpFormSchema>;
