import { z } from 'zod';

// Mirrors ChangePasswordDto (libs/iam/feature/src/lib/dto/change-password.dto.ts).
// Password strength is enforced server-side only (same convention as
// setup-form-schema.ts) - the backend 400s with the specific requirement(s)
// that failed.
export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(1, 'Enter a new password'),
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
