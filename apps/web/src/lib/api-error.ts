export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

// Every "My ..."/"Team ..." self-service endpoint (leave, payslips, benefits,
// performance, attendance, payment method, recruitment) resolves the
// caller's own Employee record first and throws this exact 403 message when
// there isn't one - a normal, expected state for portal accounts that were
// never linked to an employee (e.g. an admin-only account), not a real
// failure. Callers use this to render a calm explanation instead of the
// generic error state. See EmployeeLinkRequiredState.
const NO_EMPLOYEE_LINKED_MESSAGE = 'No employee record is linked to this account';

export function isNoEmployeeLinkedError(error: unknown): boolean {
  return getApiErrorMessage(error) === NO_EMPLOYEE_LINKED_MESSAGE;
}
