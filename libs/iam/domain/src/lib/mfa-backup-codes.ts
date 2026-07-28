import { randomBytes, createHash } from 'node:crypto';

const BACKUP_CODE_COUNT = 10;
// 5 bytes -> 10 hex chars, formatted XXXXX-XXXXX for readability. Not
// meant to be memorized - each is used once then discarded, so length is
// chosen for low guessability over convenience (unlike a 6-digit TOTP
// code, these aren't time-limited, so they need more entropy).
const CODE_BYTES = 5;

export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(CODE_BYTES).toString('hex').toUpperCase();
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

/** Matches the sha256 hashing convention already used for refresh tokens. */
export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}
