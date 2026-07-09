import { canTransitionPayRunStatus, isPayRunEditable, PayRunStatus } from './pay-run-status';

describe('canTransitionPayRunStatus', () => {
  it('allows the normal happy-path progression', () => {
    expect(canTransitionPayRunStatus(PayRunStatus.DRAFT, PayRunStatus.PROCESSING)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.PROCESSING, PayRunStatus.APPROVED)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.APPROVED, PayRunStatus.PAID)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.PAID, PayRunStatus.CLOSED)).toBe(true);
  });

  it('allows cancellation before payment but not after', () => {
    expect(canTransitionPayRunStatus(PayRunStatus.DRAFT, PayRunStatus.CANCELLED)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.PROCESSING, PayRunStatus.CANCELLED)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.APPROVED, PayRunStatus.CANCELLED)).toBe(true);
    expect(canTransitionPayRunStatus(PayRunStatus.PAID, PayRunStatus.CANCELLED)).toBe(false);
  });

  it('rejects skipping states', () => {
    expect(canTransitionPayRunStatus(PayRunStatus.DRAFT, PayRunStatus.APPROVED)).toBe(false);
    expect(canTransitionPayRunStatus(PayRunStatus.DRAFT, PayRunStatus.PAID)).toBe(false);
  });

  it('rejects a no-op transition to the same status', () => {
    expect(canTransitionPayRunStatus(PayRunStatus.DRAFT, PayRunStatus.DRAFT)).toBe(false);
  });

  it('treats CLOSED and CANCELLED as terminal', () => {
    expect(canTransitionPayRunStatus(PayRunStatus.CLOSED, PayRunStatus.DRAFT)).toBe(false);
    expect(canTransitionPayRunStatus(PayRunStatus.CANCELLED, PayRunStatus.DRAFT)).toBe(false);
  });
});

describe('isPayRunEditable', () => {
  it('is editable only in DRAFT and PROCESSING', () => {
    expect(isPayRunEditable(PayRunStatus.DRAFT)).toBe(true);
    expect(isPayRunEditable(PayRunStatus.PROCESSING)).toBe(true);
    expect(isPayRunEditable(PayRunStatus.APPROVED)).toBe(false);
    expect(isPayRunEditable(PayRunStatus.PAID)).toBe(false);
    expect(isPayRunEditable(PayRunStatus.CLOSED)).toBe(false);
    expect(isPayRunEditable(PayRunStatus.CANCELLED)).toBe(false);
  });
});
