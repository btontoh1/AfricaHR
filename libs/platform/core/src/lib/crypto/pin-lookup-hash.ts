import { createHmac } from 'node:crypto';

/**
 * Deterministic (same PIN -> same output) fingerprint of a PIN, used only
 * to check "does another employee already have this PIN" without storing
 * or being able to recover the PIN itself. The real verification hash
 * (argon2, salted - see Employee.clockInPinHash) can't be used for this:
 * the same PIN hashes differently every time on purpose, so there's no
 * way to query "does this hash match any other employee's hash" even
 * though the plaintext is identical. Not a password-grade slow hash on
 * purpose - a 4-6 digit PIN has far too little entropy for that to matter,
 * and the actual defense against guessing is unchanged (the kiosk's
 * generic "Incorrect PIN" error, scoped to whichever employee was tapped).
 */
export function hashPinForLookup(pin: string, key: Buffer): string {
  return createHmac('sha256', key).update(pin).digest('hex');
}
