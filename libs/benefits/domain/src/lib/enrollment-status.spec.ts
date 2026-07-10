import { BenefitEnrollmentStatus, canCancelBenefitEnrollment } from './enrollment-status';

describe('canCancelBenefitEnrollment', () => {
  it('allows cancelling an active enrollment', () => {
    expect(canCancelBenefitEnrollment(BenefitEnrollmentStatus.ACTIVE)).toBe(true);
  });

  it('rejects cancelling an already-cancelled enrollment', () => {
    expect(canCancelBenefitEnrollment(BenefitEnrollmentStatus.CANCELLED)).toBe(false);
  });
});
