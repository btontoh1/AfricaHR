import { z } from 'zod';

// Mirrors SubmitPublicApplicationDto.
export const publicApplicationFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email'),
  phone: z.string().max(30).optional().or(z.literal('')),
});

export type PublicApplicationFormValues = z.infer<typeof publicApplicationFormSchema>;
