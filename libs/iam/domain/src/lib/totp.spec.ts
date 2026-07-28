import { TOTP, Secret } from 'otpauth';
import { generateTotpSecret, buildTotpUri, verifyTotpCode } from './totp';

function codeFor(secretBase32: string): string {
  return new TOTP({ secret: Secret.fromBase32(secretBase32) }).generate();
}

describe('generateTotpSecret', () => {
  it('returns a base32 string', () => {
    const secret = generateTotpSecret();

    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('generates a different secret each call', () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});

describe('buildTotpUri', () => {
  it('embeds the issuer and label in an otpauth:// URI', () => {
    const secret = generateTotpSecret();

    const uri = buildTotpUri(secret, 'ama@example.com');

    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain('ParrotHR');
    expect(uri).toContain(encodeURIComponent('ama@example.com'));
  });
});

describe('verifyTotpCode', () => {
  it('accepts a currently-valid code', () => {
    const secret = generateTotpSecret();
    const code = codeFor(secret);

    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it('rejects an incorrect code', () => {
    const secret = generateTotpSecret();
    const wrongCode = codeFor(secret) === '000000' ? '111111' : '000000';

    expect(verifyTotpCode(secret, wrongCode)).toBe(false);
  });

  it('rejects a code generated from a different secret', () => {
    const secret = generateTotpSecret();
    const otherSecret = generateTotpSecret();

    expect(verifyTotpCode(secret, codeFor(otherSecret))).toBe(false);
  });
});
