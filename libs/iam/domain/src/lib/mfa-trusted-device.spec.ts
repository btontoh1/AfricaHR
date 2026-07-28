import { generateDeviceToken, hashDeviceToken } from './mfa-trusted-device';

describe('generateDeviceToken', () => {
  it('generates a 64-character hex string (32 bytes)', () => {
    expect(generateDeviceToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens', () => {
    const tokens = Array.from({ length: 10 }, () => generateDeviceToken());

    expect(new Set(tokens).size).toBe(10);
  });
});

describe('hashDeviceToken', () => {
  it('produces a consistent hash for the same token', () => {
    const token = generateDeviceToken();

    expect(hashDeviceToken(token)).toBe(hashDeviceToken(token));
  });

  it('is case-sensitive, unlike hashBackupCode - a raw token is never human-typed', () => {
    expect(hashDeviceToken('abcdef')).not.toBe(hashDeviceToken('ABCDEF'));
  });

  it('produces different hashes for different tokens', () => {
    expect(hashDeviceToken(generateDeviceToken())).not.toBe(hashDeviceToken(generateDeviceToken()));
  });
});
