import { randomBytes, createHash } from 'node:crypto';

// Machine-generated and stored in an httpOnly cookie, never typed by a
// human - unlike hashBackupCode, this deliberately does NOT uppercase the
// raw value before hashing, since doing so would only throw away entropy
// for no readability benefit.
const DEVICE_TOKEN_BYTES = 32;

export function generateDeviceToken(): string {
  return randomBytes(DEVICE_TOKEN_BYTES).toString('hex');
}

/** Matches the sha256 hashing convention already used for refresh tokens. */
export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
