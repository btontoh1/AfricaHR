import { z } from 'zod';

// Mirrors getPasswordRequirementErrors in libs/iam/domain/src/lib/password-strength.ts.
// Duplicated rather than imported: that lib's barrel also re-exports
// Node-only crypto helpers (mfa-secret-crypto.ts, totp.ts) that can't ship in
// a client bundle. Keep PASSWORD_REQUIREMENTS_TEXT and these checks in sync
// with the backend by hand if the rules ever change.
const MIN_LENGTH = 12;

export const PASSWORD_REQUIREMENTS_TEXT = `At least ${MIN_LENGTH} characters, with an uppercase letter, a lowercase letter, and a digit.`;

function getPasswordRequirementErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a digit');
  }

  return errors;
}

export const newPasswordSchema = z.string().superRefine((value, ctx) => {
  const errors = getPasswordRequirementErrors(value);
  if (errors.length > 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: errors.join(', ') });
  }
});
