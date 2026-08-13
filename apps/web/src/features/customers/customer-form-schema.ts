import { z } from 'zod';

export const createCustomerFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  billingAddress: z.string().max(500).optional().or(z.literal('')),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerFormSchema>;

export const editCustomerFormSchema = createCustomerFormSchema.omit({ organizationId: true });

export type EditCustomerFormValues = z.infer<typeof editCustomerFormSchema>;
