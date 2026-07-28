import { z } from 'zod';

// Mirrors ConfirmMfaDto (libs/iam/feature/src/lib/dto/confirm-mfa.dto.ts).
export const mfaConfirmFormSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code from your authenticator app'),
});

export type MfaConfirmFormValues = z.infer<typeof mfaConfirmFormSchema>;

// Mirrors DisableMfaDto (libs/iam/feature/src/lib/dto/disable-mfa.dto.ts).
export const mfaDisableFormSchema = z.object({
  password: z.string().min(1, 'Enter your current password'),
});

export type MfaDisableFormValues = z.infer<typeof mfaDisableFormSchema>;
