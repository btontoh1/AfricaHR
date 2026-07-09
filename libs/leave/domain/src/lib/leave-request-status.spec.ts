import { canTransitionLeaveRequestStatus, LeaveRequestStatus } from './leave-request-status';

describe('canTransitionLeaveRequestStatus', () => {
  it('allows approval and rejection from PENDING', () => {
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED)).toBe(
      true,
    );
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.PENDING, LeaveRequestStatus.REJECTED)).toBe(
      true,
    );
  });

  it('allows cancellation from PENDING and APPROVED', () => {
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.PENDING, LeaveRequestStatus.CANCELLED)).toBe(
      true,
    );
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.APPROVED, LeaveRequestStatus.CANCELLED)).toBe(
      true,
    );
  });

  it('treats REJECTED and CANCELLED as terminal', () => {
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.REJECTED, LeaveRequestStatus.PENDING)).toBe(
      false,
    );
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.CANCELLED, LeaveRequestStatus.PENDING)).toBe(
      false,
    );
  });

  it('rejects a no-op transition to the same status', () => {
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.PENDING, LeaveRequestStatus.PENDING)).toBe(
      false,
    );
  });

  it('rejects approving an already-approved request', () => {
    expect(canTransitionLeaveRequestStatus(LeaveRequestStatus.APPROVED, LeaveRequestStatus.APPROVED)).toBe(
      false,
    );
  });
});
