import { z } from 'zod';
import { newPasswordSchema } from '@/lib/password-schema';

// Excludes PLATFORM_ADMIN — only a platform admin can grant PLATFORM_ADMIN
// (the backend 400s a tenant-scoped actor attempting it either at creation
// or role-change time), so it's never offered here.
//
// Also excludes ORG_ADMIN - the inline "change role" dropdown in
// team-members-list.tsx has nowhere to collect the organizationId ORG_ADMIN
// requires, so that role change only happens through CreateUserForm below
// (new account) for now. RoleControl renders an existing ORG_ADMIN as a
// fixed label instead, same treatment as PLATFORM_ADMIN.
const ASSIGNABLE_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE'] as const;

// CreateUserForm's role picker, unlike the inline one above, also offers
// ORG_ADMIN - it already has a form to collect organizationId alongside it.
const CREATE_ROLES = [...ASSIGNABLE_ROLES, 'ORG_ADMIN'] as const;

// Mirrors CreateUserDto (libs/iam/feature/src/lib/dto/create-user.dto.ts).
export const createUserFormSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: newPasswordSchema,
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    role: z.enum(CREATE_ROLES),
    organizationId: z.string().optional(),
  })
  .refine((values) => values.role !== 'ORG_ADMIN' || Boolean(values.organizationId), {
    message: 'Choose which organization this admin manages',
    path: ['organizationId'],
  });

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const ASSIGNABLE_ROLE_OPTIONS = ASSIGNABLE_ROLES;
export const CREATE_ROLE_OPTIONS = CREATE_ROLES;

// Mirrors UpdateUserProfileDto (libs/iam/feature/src/lib/dto/update-user-profile.dto.ts).
export const updateUserProfileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email'),
});

export type UpdateUserProfileFormValues = z.infer<typeof updateUserProfileFormSchema>;

// Mirrors AdminResetPasswordDto.
export const resetUserPasswordFormSchema = z.object({
  newPassword: newPasswordSchema,
});

export type ResetUserPasswordFormValues = z.infer<typeof resetUserPasswordFormSchema>;
