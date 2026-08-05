import { generateSmsOtp, hashSmsOtp, isValidPhoneNumber, phoneNumberLast4 } from './sms-otp';

describe('sms-otp', () => {
  describe('generateSmsOtp', () => {
    it('generates a 6-digit numeric code, zero-padded', () => {
      for (let i = 0; i < 50; i++) {
        expect(generateSmsOtp()).toMatch(/^\d{6}$/);
      }
    });
  });

  describe('hashSmsOtp', () => {
    it('is deterministic for the same code', () => {
      expect(hashSmsOtp('123456')).toBe(hashSmsOtp('123456'));
    });

    it('differs for different codes', () => {
      expect(hashSmsOtp('123456')).not.toBe(hashSmsOtp('654321'));
    });
  });

  describe('isValidPhoneNumber', () => {
    it('accepts E.164-formatted numbers', () => {
      expect(isValidPhoneNumber('+233201234567')).toBe(true);
      expect(isValidPhoneNumber('+14155552671')).toBe(true);
    });

    it('rejects numbers without a leading +', () => {
      expect(isValidPhoneNumber('233201234567')).toBe(false);
    });

    it('rejects numbers with formatting punctuation', () => {
      expect(isValidPhoneNumber('+233 20 123 4567')).toBe(false);
      expect(isValidPhoneNumber('+233-20-123-4567')).toBe(false);
    });

    it('rejects a leading zero after the +', () => {
      expect(isValidPhoneNumber('+0233201234567')).toBe(false);
    });

    it('rejects obviously too-short or too-long strings', () => {
      expect(isValidPhoneNumber('+123')).toBe(false);
      expect(isValidPhoneNumber('+1234567890123456')).toBe(false);
    });
  });

  describe('phoneNumberLast4', () => {
    it('returns the last 4 digits', () => {
      expect(phoneNumberLast4('+233201234567')).toBe('4567');
    });
  });
});
