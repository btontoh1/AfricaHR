import { Secret, TOTP } from 'otpauth';

const ISSUER = 'ParotHR';
// Tolerates one 30s step of clock drift each direction between server and
// the user's authenticator app - the standard TOTP allowance, not
// something to widen casually (each extra step doubles the guessable
// window for an attacker with a stolen/guessed code).
const VALIDATION_WINDOW = 1;

export function generateTotpSecret(): string {
  return new Secret().base32;
}

/**
 * otpauth:// URI for QR-code rendering. `label` is the account identifier
 * shown under the entry in the user's authenticator app - their email, so
 * multiple ParotHR accounts (e.g. platform admin + a tenant account) are
 * distinguishable.
 */
export function buildTotpUri(secretBase32: string, label: string): string {
  const totp = new TOTP({
    issuer: ISSUER,
    label,
    secret: Secret.fromBase32(secretBase32),
  });
  return totp.toString();
}

export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new TOTP({
    issuer: ISSUER,
    secret: Secret.fromBase32(secretBase32),
  });
  return totp.validate({ token: code, window: VALIDATION_WINDOW }) !== null;
}
