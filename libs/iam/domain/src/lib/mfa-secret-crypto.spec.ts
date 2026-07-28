import { randomBytes } from 'node:crypto';
import { deriveMfaEncryptionKey, encryptMfaSecret, decryptMfaSecret } from './mfa-secret-crypto';

const validHexKey = randomBytes(32).toString('hex');

describe('deriveMfaEncryptionKey', () => {
  it('returns a 32-byte buffer for a valid 64-char hex key', () => {
    const key = deriveMfaEncryptionKey(validHexKey);

    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('throws when the key is unset', () => {
    expect(() => deriveMfaEncryptionKey(undefined)).toThrow(/MFA_ENCRYPTION_KEY must be set/);
  });

  it('throws when the key is the wrong length', () => {
    expect(() => deriveMfaEncryptionKey('too-short')).toThrow(/64-character hex string/);
  });
});

describe('encryptMfaSecret / decryptMfaSecret', () => {
  const key = deriveMfaEncryptionKey(validHexKey);

  it('round-trips a secret', () => {
    const encrypted = encryptMfaSecret('JBSWY3DPEHPK3PXP', key);

    expect(decryptMfaSecret(encrypted, key)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const first = encryptMfaSecret('JBSWY3DPEHPK3PXP', key);
    const second = encryptMfaSecret('JBSWY3DPEHPK3PXP', key);

    expect(first).not.toBe(second);
  });

  it('fails to decrypt with the wrong key, rather than returning garbage', () => {
    const encrypted = encryptMfaSecret('JBSWY3DPEHPK3PXP', key);
    const wrongKey = deriveMfaEncryptionKey(randomBytes(32).toString('hex'));

    expect(() => decryptMfaSecret(encrypted, wrongKey)).toThrow();
  });

  it('rejects a malformed encrypted value', () => {
    expect(() => decryptMfaSecret('not-the-right-shape', key)).toThrow(/Malformed/);
  });
});
