import { z } from 'zod';

// Mirrors UpdateTenantDto (libs/tenancy/feature/src/lib/dto/update-tenant.dto.ts).
// Unlike createTenantFormSchema, slug is required here rather than
// optional-with-auto-generation - the tenant already has one, and editing
// it is an explicit, deliberate action (it's the sign-in URL).
export const editTenantFormSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required').max(64),
});

export type EditTenantFormValues = z.infer<typeof editTenantFormSchema>;
