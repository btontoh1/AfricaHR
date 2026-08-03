import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

/**
 * Generic AES-256-GCM field-encryption primitive, shared by every
 * at-rest encryption need in this codebase that crosses an Nx module
 * boundary (e.g. employee-feature encrypts EmployeePaymentMethod fields,
 * payroll-feature decrypts them again to disburse pay - scope:payroll
 * cannot depend on scope:employee, so the primitive has to live in
 * scope:platform for both to share it). MFA already had its own
 * AES-256-GCM implementation before this existed
 * (libs/iam/domain/src/lib/mfa-secret-crypto.ts) - it has a single
 * in-scope consumer (iam-feature), so there was no cross-boundary need
 * driving it to live here too. Left as-is rather than refactored onto
 * this primitive, since that's a change to already-shipped, unrelated
 * code beyond what any one feature needs.
 */
export function deriveEncryptionKey(hexKey: string | undefined, envVarName: string): Buffer {
  if (!hexKey) {
    throw new Error(`${envVarName} must be set to use this feature`);
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `${envVarName} must be a ${KEY_LENGTH_BYTES * 2}-character hex string (${KEY_LENGTH_BYTES} bytes)`,
    );
  }
  return key;
}

/**
 * Output layout is `iv:authTag:ciphertext`, all hex - a fresh random IV
 * per call (GCM's security depends on never reusing an IV with the same
 * key), and the auth tag stored alongside so decryptAesGcm can detect
 * tampering/corruption rather than silently returning garbage.
 */
export function encryptAesGcm(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptAesGcm(encrypted: string, key: Buffer): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted value');
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
