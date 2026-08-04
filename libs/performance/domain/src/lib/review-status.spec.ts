import { canTransitionReviewStatus, PerformanceReviewStatus } from './review-status';

describe('canTransitionReviewStatus', () => {
  it('allows the normal self-submit-then-complete path', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.DRAFT, PerformanceReviewStatus.SELF_SUBMITTED),
    ).toBe(true);
    expect(
      canTransitionReviewStatus(
        PerformanceReviewStatus.SELF_SUBMITTED,
        PerformanceReviewStatus.COMPLETED,
      ),
    ).toBe(true);
  });

  it('allows a manager to complete directly from DRAFT when self-assessment was skipped', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.DRAFT, PerformanceReviewStatus.COMPLETED),
    ).toBe(true);
  });

  it('treats COMPLETED as terminal', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.COMPLETED, PerformanceReviewStatus.DRAFT),
    ).toBe(false);
    expect(
      canTransitionReviewStatus(
        PerformanceReviewStatus.COMPLETED,
        PerformanceReviewStatus.SELF_SUBMITTED,
      ),
    ).toBe(false);
  });

  it('rejects a no-op transition to the same status', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.DRAFT, PerformanceReviewStatus.DRAFT),
    ).toBe(false);
  });

  it('rejects going backwards from SELF_SUBMITTED to DRAFT', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.SELF_SUBMITTED, PerformanceReviewStatus.DRAFT),
    ).toBe(false);
  });

  it('allows cancelling from DRAFT or SELF_SUBMITTED', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.DRAFT, PerformanceReviewStatus.CANCELLED),
    ).toBe(true);
    expect(
      canTransitionReviewStatus(
        PerformanceReviewStatus.SELF_SUBMITTED,
        PerformanceReviewStatus.CANCELLED,
      ),
    ).toBe(true);
  });

  it('rejects cancelling a COMPLETED review', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.COMPLETED, PerformanceReviewStatus.CANCELLED),
    ).toBe(false);
  });

  it('treats CANCELLED as terminal', () => {
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.CANCELLED, PerformanceReviewStatus.DRAFT),
    ).toBe(false);
    expect(
      canTransitionReviewStatus(
        PerformanceReviewStatus.CANCELLED,
        PerformanceReviewStatus.SELF_SUBMITTED,
      ),
    ).toBe(false);
    expect(
      canTransitionReviewStatus(PerformanceReviewStatus.CANCELLED, PerformanceReviewStatus.COMPLETED),
    ).toBe(false);
  });
});
