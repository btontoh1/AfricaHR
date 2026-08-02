import { z } from 'zod';

// Mirrors AssignSubscriptionDto (libs/billing/feature/src/lib/dto/assign-subscription.dto.ts).
// pricePerEmployee is kept as a string in the form (HTML number inputs bind
// to react-hook-form as strings) and converted to a number at submission -
// same convention as benefits-form-schema's contribution fields.
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
});

export type AssignSubscriptionFormValues = z.infer<typeof assignSubscriptionFormSchema>;
