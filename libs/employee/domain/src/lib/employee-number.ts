const EMPLOYEE_NUMBER_PATTERN = /^[A-Z]{2,6}-\d{4,}$/;

export function isValidEmployeeNumber(value: string): boolean {
  return EMPLOYEE_NUMBER_PATTERN.test(value);
}

/**
 * Formats a sequence number into an employee number, e.g. sequence=7 ->
 * "EMP-0007". The sequence itself (what's the next available number for
 * this tenant) is a data-access concern, not a domain one.
 */
export function formatEmployeeNumber(sequence: number, prefix = 'EMP'): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}
