const MIN_LENGTH = 12;

export function getPasswordRequirementErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a digit');
  }

  return errors;
}

export function isValidPassword(password: string): boolean {
  return getPasswordRequirementErrors(password).length === 0;
}
