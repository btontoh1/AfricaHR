import { z } from 'zod';

// Mirrors SubmitDemoRequestDto.
export const demoRequestFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email('Enter a valid email'),
  phoneNumber: z.string().max(30).optional().or(z.literal('')),
  organizationName: z.string().min(1, 'Organization name is required').max(200),
  numberOfEmployees: z.string().max(30).optional().or(z.literal('')),
  preferredDate: z.string().max(30).optional().or(z.literal('')),
  preferredTime: z.string().max(30).optional().or(z.literal('')),
});

export type DemoRequestFormValues = z.infer<typeof demoRequestFormSchema>;
