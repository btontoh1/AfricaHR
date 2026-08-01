import { z } from 'zod';

// Mirrors CreateTenantDto (libs/tenancy/feature/src/lib/dto/create-tenant.dto.ts)
// for the tenant fields, and CreateUserDto (libs/iam/feature/src/lib/dto/create-user.dto.ts)
// for the admin fields - role is fixed to TENANT_ADMIN, not user-editable.
// Password strength is enforced server-side only (same convention as
// setup-form-schema.ts) - the backend 400s with the specific requirement(s)
// that failed.
export const createTenantFormSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only')
    .optional()
    .or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required').max(64),
  adminFirstName: z.string().min(1, 'First name is required').max(100),
  adminLastName: z.string().min(1, 'Last name is required').max(100),
  adminEmail: z.string().email('Enter a valid email address'),
  adminPassword: z.string().min(1, 'Password is required'),
});

export type CreateTenantFormValues = z.infer<typeof createTenantFormSchema>;
