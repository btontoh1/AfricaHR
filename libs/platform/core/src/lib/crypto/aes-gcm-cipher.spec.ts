import { randomBytes } from 'node:crypto';
import { deriveEncryptionKey, encryptAesGcm, decryptAesGcm } from './aes-gcm-cipher';

const validHexKey = randomBytes(32).toString('hex');

describe('deriveEncryptionKey', () => {
  it('returns a 32-byte buffer for a valid 64-char hex key', () => {
    const key = deriveEncryptionKey(validHexKey, 'SOME_KEY');

    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('throws mentioning the given env var name when the key is unset', () => {
    expect(() => deriveEncryptionKey(undefined, 'PAYMENT_METHOD_ENCRYPTION_KEY')).toThrow(
      /PAYMENT_METHOD_ENCRYPTION_KEY must be set/,
    );
  });

  it('throws mentioning the given env var name when the key is the wrong length', () => {
    expect(() => deriveEncryptionKey('too-short', 'PAYMENT_METHOD_ENCRYPTION_KEY')).toThrow(
      /PAYMENT_METHOD_ENCRYPTION_KEY must be a 64-character hex string/,
    );
  });
});

describe('encryptAesGcm / decryptAesGcm', () => {
  const key = deriveEncryptionKey(validHexKey, 'SOME_KEY');

  it('round-trips a value', () => {
    const encrypted = encryptAesGcm('1234567890', key);

    expect(decryptAesGcm(encrypted, key)).toBe('1234567890');
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const first = encryptAesGcm('1234567890', key);
    const second = encryptAesGcm('1234567890', key);

    expect(first).not.toBe(second);
  });

  it('fails to decrypt with the wrong key, rather than returning garbage', () => {
    const encrypted = encryptAesGcm('1234567890', key);
    const wrongKey = deriveEncryptionKey(randomBytes(32).toString('hex'), 'SOME_KEY');

    expect(() => decryptAesGcm(encrypted, wrongKey)).toThrow();
  });

  it('rejects a malformed encrypted value', () => {
    expect(() => decryptAesGcm('not-the-right-shape', key)).toThrow(/Malformed/);
  });
});
