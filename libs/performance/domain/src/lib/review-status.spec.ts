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
});
