import { z } from 'zod';
import { newPasswordSchema } from '@/lib/password-schema';

// Excludes PLATFORM_ADMIN — only a platform admin can grant PLATFORM_ADMIN
// (the backend 400s a tenant-scoped actor attempting it either at creation
// or role-change time), so it's never offered here.
const ASSIGNABLE_ROLES = ['TENANT_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'EMPLOYEE'] as const;

// Mirrors CreateUserDto (libs/iam/feature/src/lib/dto/create-user.dto.ts).
export const createUserFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: newPasswordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(ASSIGNABLE_ROLES),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const ASSIGNABLE_ROLE_OPTIONS = ASSIGNABLE_ROLES;

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
