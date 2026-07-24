import {
  assertValidOrganizationVerificationStatusTransition,
  canTransitionOrganizationVerificationStatus,
  OrganizationVerificationStatus,
} from './organization-verification-status';

describe('organization verification status transitions', () => {
  it.each([
    [OrganizationVerificationStatus.UNVERIFIED, OrganizationVerificationStatus.PENDING_REVIEW, true],
    [OrganizationVerificationStatus.UNVERIFIED, OrganizationVerificationStatus.VERIFIED, false],
    [OrganizationVerificationStatus.UNVERIFIED, OrganizationVerificationStatus.REJECTED, false],
    [OrganizationVerificationStatus.PENDING_REVIEW, OrganizationVerificationStatus.VERIFIED, true],
    [OrganizationVerificationStatus.PENDING_REVIEW, OrganizationVerificationStatus.REJECTED, true],
    [OrganizationVerificationStatus.PENDING_REVIEW, OrganizationVerificationStatus.UNVERIFIED, false],
    [OrganizationVerificationStatus.VERIFIED, OrganizationVerificationStatus.PENDING_REVIEW, false],
    [OrganizationVerificationStatus.REJECTED, OrganizationVerificationStatus.PENDING_REVIEW, true],
    [OrganizationVerificationStatus.REJECTED, OrganizationVerificationStatus.VERIFIED, false],
  ])('%s -> %s allowed = %s', (from, to, expected) => {
    expect(canTransitionOrganizationVerificationStatus(from, to)).toBe(expected);
  });

  it('rejects a transition to the same status', () => {
    expect(
      canTransitionOrganizationVerificationStatus(
        OrganizationVerificationStatus.PENDING_REVIEW,
        OrganizationVerificationStatus.PENDING_REVIEW,
      ),
    ).toBe(false);
  });

  it('assertValidOrganizationVerificationStatusTransition throws on an illegal transition', () => {
    expect(() =>
      assertValidOrganizationVerificationStatusTransition(
        OrganizationVerificationStatus.VERIFIED,
        OrganizationVerificationStatus.PENDING_REVIEW,
      ),
    ).toThrow(/Cannot transition/);
  });

  it('assertValidOrganizationVerificationStatusTransition does not throw on a legal transition', () => {
    expect(() =>
      assertValidOrganizationVerificationStatusTransition(
        OrganizationVerificationStatus.UNVERIFIED,
        OrganizationVerificationStatus.PENDING_REVIEW,
      ),
    ).not.toThrow();
  });
});
