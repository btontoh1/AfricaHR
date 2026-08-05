import { randomInt, createHash } from 'node:crypto';

const OTP_LENGTH = 6;

/** 6-digit numeric code, sent by SMS - short-lived (see MfaService), so entropy needs are lower than a backup code. */
export function generateSmsOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

/** Matches the sha256 hashing convention already used for backup codes/device tokens. */
export function hashSmsOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// Permissive E.164 check (a leading "+" then 8-15 digits, no formatting
// punctuation) rather than a full libphonenumber-style validator - good
// enough to reject obvious garbage before an SMS provider is ever charged
// for a send attempt, without adding a new dependency for it.
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return E164_PATTERN.test(phoneNumber);
}

/** Last 4 digits, for login-time messaging ("code sent to phone ending in 1234") without echoing the full number back. */
export function phoneNumberLast4(phoneNumber: string): string {
  return phoneNumber.slice(-4);
}
