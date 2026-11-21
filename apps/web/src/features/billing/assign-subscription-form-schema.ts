import { z } from 'zod';

// Mirrors AssignSubscriptionDto (libs/billing/feature/src/lib/dto/assign-subscription.dto.ts).
// pricePerEmployee/flatFeeAmount/includedEmployeeCount are kept as strings in
// the form (HTML number inputs bind to react-hook-form as strings) and
// converted to numbers at submission - same convention as benefits-form-
// schema's contribution fields. flatFeeAmount and includedEmployeeCount are
// both optional - an empty string means "pure per-employee billing", same
// as omitting them from the API request.
export const assignSubscriptionFormSchema = z.object({
  pricePerEmployee: z
    .string()
    .min(1, 'Price per employee is required')
    .refine((value) => Number(value) > 0, 'Must be a positive amount'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO 4217 currency code'),
  flatFeeAmount: z
    .string()
    .refine((value) => value === '' || Number(value) >= 0, 'Must be a non-negative amount'),
  includedEmployeeCount: z
    .string()
    .refine(
      (value) => value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0),
      'Must be a non-negative whole number',
    ),
});

export type AssignSubscriptionFormValues = z.infer<typeof assignSubscriptionFormSchema>;
