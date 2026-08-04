import { canTransitionRequisitionStatus, JobRequisitionStatus } from './job-requisition-status';

describe('canTransitionRequisitionStatus', () => {
  it('allows DRAFT to open or be cancelled', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.DRAFT, JobRequisitionStatus.OPEN)).toBe(
      true,
    );
    expect(
      canTransitionRequisitionStatus(JobRequisitionStatus.DRAFT, JobRequisitionStatus.CANCELLED),
    ).toBe(true);
  });

  it('rejects DRAFT going straight to CLOSED or ON_HOLD', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.DRAFT, JobRequisitionStatus.CLOSED)).toBe(
      false,
    );
    expect(
      canTransitionRequisitionStatus(JobRequisitionStatus.DRAFT, JobRequisitionStatus.ON_HOLD),
    ).toBe(false);
  });

  it('allows OPEN to pause, close, or be cancelled', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.OPEN, JobRequisitionStatus.ON_HOLD)).toBe(
      true,
    );
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.OPEN, JobRequisitionStatus.CLOSED)).toBe(
      true,
    );
    expect(
      canTransitionRequisitionStatus(JobRequisitionStatus.OPEN, JobRequisitionStatus.CANCELLED),
    ).toBe(true);
  });

  it('rejects OPEN going back to DRAFT', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.OPEN, JobRequisitionStatus.DRAFT)).toBe(
      false,
    );
  });

  it('allows ON_HOLD to resume to OPEN, or follow the same CLOSED/CANCELLED paths as OPEN', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.ON_HOLD, JobRequisitionStatus.OPEN)).toBe(
      true,
    );
    expect(
      canTransitionRequisitionStatus(JobRequisitionStatus.ON_HOLD, JobRequisitionStatus.CLOSED),
    ).toBe(true);
    expect(
      canTransitionRequisitionStatus(JobRequisitionStatus.ON_HOLD, JobRequisitionStatus.CANCELLED),
    ).toBe(true);
  });

  it('rejects ON_HOLD going back to DRAFT', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.ON_HOLD, JobRequisitionStatus.DRAFT)).toBe(
      false,
    );
  });

  it('treats CLOSED and CANCELLED as terminal', () => {
    for (const to of [
      JobRequisitionStatus.DRAFT,
      JobRequisitionStatus.OPEN,
      JobRequisitionStatus.ON_HOLD,
      JobRequisitionStatus.CANCELLED,
    ]) {
      expect(canTransitionRequisitionStatus(JobRequisitionStatus.CLOSED, to)).toBe(false);
    }
    for (const to of [
      JobRequisitionStatus.DRAFT,
      JobRequisitionStatus.OPEN,
      JobRequisitionStatus.ON_HOLD,
      JobRequisitionStatus.CLOSED,
    ]) {
      expect(canTransitionRequisitionStatus(JobRequisitionStatus.CANCELLED, to)).toBe(false);
    }
  });

  it('rejects a no-op transition to the same status', () => {
    expect(canTransitionRequisitionStatus(JobRequisitionStatus.OPEN, JobRequisitionStatus.OPEN)).toBe(
      false,
    );
  });
});
