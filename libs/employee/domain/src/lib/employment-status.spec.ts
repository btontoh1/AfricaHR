import { canTransitionEmploymentStatus, EmploymentStatus } from './employment-status';

describe('employment status transitions', () => {
  it.each([
    [EmploymentStatus.PENDING_ONBOARDING, EmploymentStatus.ACTIVE, true],
    [EmploymentStatus.PENDING_ONBOARDING, EmploymentStatus.TERMINATED, true],
    [EmploymentStatus.PENDING_ONBOARDING, EmploymentStatus.ON_LEAVE, false],
    [EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE, true],
    [EmploymentStatus.ACTIVE, EmploymentStatus.SUSPENDED, true],
    [EmploymentStatus.ACTIVE, EmploymentStatus.TERMINATED, true],
    [EmploymentStatus.ACTIVE, EmploymentStatus.PENDING_ONBOARDING, false],
    [EmploymentStatus.ON_LEAVE, EmploymentStatus.ACTIVE, true],
    [EmploymentStatus.SUSPENDED, EmploymentStatus.ACTIVE, true],
    [EmploymentStatus.TERMINATED, EmploymentStatus.ACTIVE, false],
  ])('%s -> %s allowed = %s', (from, to, expected) => {
    expect(canTransitionEmploymentStatus(from, to)).toBe(expected);
  });

  it('rejects a transition to the same status', () => {
    expect(canTransitionEmploymentStatus(EmploymentStatus.ACTIVE, EmploymentStatus.ACTIVE)).toBe(
      false,
    );
  });

  it('TERMINATED is terminal', () => {
    expect(
      canTransitionEmploymentStatus(EmploymentStatus.TERMINATED, EmploymentStatus.SUSPENDED),
    ).toBe(false);
  });
});
