import { generateBackupCodes, hashBackupCode } from './mfa-backup-codes';

describe('generateBackupCodes', () => {
  it('generates 10 codes by default', () => {
    expect(generateBackupCodes()).toHaveLength(10);
  });

  it('generates the requested count', () => {
    expect(generateBackupCodes(3)).toHaveLength(3);
  });

  it('formats codes as XXXXX-XXXXX', () => {
    const codes = generateBackupCodes(5);

    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
    }
  });

  it('generates unique codes within a batch', () => {
    const codes = generateBackupCodes(10);

    expect(new Set(codes).size).toBe(10);
  });
});

describe('hashBackupCode', () => {
  it('produces a consistent hash for the same code', () => {
    expect(hashBackupCode('ABCDE-12345')).toBe(hashBackupCode('ABCDE-12345'));
  });

  it('is case-insensitive, so a lowercase paste still matches', () => {
    expect(hashBackupCode('abcde-12345')).toBe(hashBackupCode('ABCDE-12345'));
  });

  it('produces different hashes for different codes', () => {
    expect(hashBackupCode('ABCDE-12345')).not.toBe(hashBackupCode('FGHIJ-67890'));
  });
});
