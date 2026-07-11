import { z } from 'zod';

// Mirrors SetupDto (apps/api/src/app/setup/dto/setup.dto.ts). Password
// strength is enforced server-side only (same convention as
// team-members-form-schema.ts) — the backend 400s with the specific
// requirement(s) that failed.
export const setupFormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(200),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Use a 2-letter country code, e.g. GH'),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code, e.g. GHS'),
  timezone: z.string().min(1, 'Timezone is required').max(64),
  adminFirstName: z.string().min(1, 'First name is required').max(100),
  adminLastName: z.string().min(1, 'Last name is required').max(100),
  adminEmail: z.string().email('Enter a valid email address'),
  adminPassword: z.string().min(1, 'Password is required'),
});

export type SetupFormValues = z.infer<typeof setupFormSchema>;
