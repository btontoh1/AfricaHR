import { z } from 'zod';
import { newPasswordSchema } from '@/lib/password-schema';

// Mirrors CreatePlatformAdminDto (libs/iam/feature/src/lib/dto/create-platform-admin.dto.ts)
// - no role field, since this screen only ever creates PLATFORM_ADMIN accounts.
export const addPlatformAdminFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: newPasswordSchema,
});

export type AddPlatformAdminFormValues = z.infer<typeof addPlatformAdminFormSchema>;
