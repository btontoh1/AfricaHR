import { z } from 'zod';

export const createVendorFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
});

export type CreateVendorFormValues = z.infer<typeof createVendorFormSchema>;

export const editVendorFormSchema = createVendorFormSchema.omit({ organizationId: true });

export type EditVendorFormValues = z.infer<typeof editVendorFormSchema>;
