import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;

/**
 * Derives the AES-256 key from MFA_ENCRYPTION_KEY (a 64-char hex string =
 * 32 bytes). Throws on a missing/malformed key rather than silently
 * falling back to something weaker - unlike SendGrid, there's no safe
 * placeholder for "encrypt this TOTP secret" once a user has actually
 * enrolled, so this fails loud the same way JWT_ACCESS_SECRET does.
 */
export function deriveMfaEncryptionKey(hexKey: string | undefined): Buffer {
  if (!hexKey) {
    throw new Error('MFA_ENCRYPTION_KEY must be set to use MFA');
  }
  const key = Buffer.from(hexKey, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `MFA_ENCRYPTION_KEY must be a ${KEY_LENGTH_BYTES * 2}-character hex string (${KEY_LENGTH_BYTES} bytes)`,
    );
  }
  return key;
}

/**
 * AES-256-GCM. Output layout is `iv:authTag:ciphertext`, all hex - a fresh
 * random IV per call (GCM's security depends on never reusing an IV with
 * the same key), and the auth tag stored alongside so decryptMfaSecret can
 * detect tampering/corruption rather than silently returning garbage.
 */
export function encryptMfaSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

export function decryptMfaSecret(encrypted: string, key: Buffer): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted MFA secret');
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
