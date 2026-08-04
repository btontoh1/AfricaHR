import { getDefaultCurrencyForCountry } from './country-currency';

describe('getDefaultCurrencyForCountry', () => {
  it('returns GHS for Ghana', () => {
    expect(getDefaultCurrencyForCountry('GH')).toBe('GHS');
  });

  it('returns NGN for Nigeria', () => {
    expect(getDefaultCurrencyForCountry('NG')).toBe('NGN');
  });

  it('returns KES for Kenya', () => {
    expect(getDefaultCurrencyForCountry('KE')).toBe('KES');
  });

  it('throws for a country with no configured currency, rather than guessing', () => {
    expect(() => getDefaultCurrencyForCountry('ZA')).toThrow(
      'No default currency configured for country "ZA"',
    );
  });
});
