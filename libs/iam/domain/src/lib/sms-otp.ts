import { randomInt, createHash } from 'node:crypto';
import { isValidE164PhoneNumber } from '@africahr/platform-core';

const OTP_LENGTH = 6;

/** 6-digit numeric code, sent by SMS - short-lived (see MfaService), so entropy needs are lower than a backup code. */
export function generateSmsOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

/** Matches the sha256 hashing convention already used for backup codes/device tokens. */
export function hashSmsOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// Moved to platform-core so payroll's payslip-delivery feature can share
// the same E.164 check without scope:employee/scope:payroll reaching into
// scope:iam (Nx module boundary) - re-exported here under its original
// name so every existing MFA call site keeps working unchanged.
export const isValidPhoneNumber = isValidE164PhoneNumber;

/** Last 4 digits, for login-time messaging ("code sent to phone ending in 1234") without echoing the full number back. */
export function phoneNumberLast4(phoneNumber: string): string {
  return phoneNumber.slice(-4);
}
