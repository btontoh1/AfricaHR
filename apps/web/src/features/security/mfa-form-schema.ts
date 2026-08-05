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

// Mirrors SetupSmsMfaDto (libs/iam/feature/src/lib/dto/setup-sms-mfa.dto.ts).
export const mfaSmsSetupFormSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Enter a phone number in E.164 format, e.g. +233201234567'),
});

export type MfaSmsSetupFormValues = z.infer<typeof mfaSmsSetupFormSchema>;
