import { z } from 'zod';

// Mirrors CreateUserDto (libs/iam/feature/src/lib/dto/create-user.dto.ts),
// scoped to a specific tenant (tenantId is supplied by the caller, not part
// of this form) and excluding PLATFORM_ADMIN from the role choices - adding
// a platform admin isn't a "this tenant" action.
export const addTenantUserFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['TENANT_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE']),
});

export type AddTenantUserFormValues = z.infer<typeof addTenantUserFormSchema>;
