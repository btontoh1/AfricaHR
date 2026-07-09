import { getPasswordRequirementErrors, isValidPassword } from './password-strength';

describe('password strength', () => {
  it('accepts a password meeting all requirements', () => {
    expect(isValidPassword('CorrectHorse9')).toBe(true);
    expect(getPasswordRequirementErrors('CorrectHorse9')).toHaveLength(0);
  });

  it('rejects a password that is too short', () => {
    expect(isValidPassword('Aa1aaaaa')).toBe(false);
  });

  it('rejects a password with no uppercase letter', () => {
    const errors = getPasswordRequirementErrors('correcthorse9battery');
    expect(errors).toContain('Password must contain an uppercase letter');
  });

  it('rejects a password with no lowercase letter', () => {
    const errors = getPasswordRequirementErrors('CORRECTHORSE9BATTERY');
    expect(errors).toContain('Password must contain a lowercase letter');
  });

  it('rejects a password with no digit', () => {
    const errors = getPasswordRequirementErrors('CorrectHorseBattery');
    expect(errors).toContain('Password must contain a digit');
  });

  it('reports all violated requirements at once', () => {
    expect(getPasswordRequirementErrors('short')).toHaveLength(3);
  });
});
