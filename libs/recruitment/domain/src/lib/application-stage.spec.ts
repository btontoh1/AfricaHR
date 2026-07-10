import { ApplicationStage, canTransitionApplicationStage } from './application-stage';

describe('canTransitionApplicationStage', () => {
  it('allows the normal linear pipeline progression', () => {
    expect(canTransitionApplicationStage(ApplicationStage.APPLIED, ApplicationStage.SCREENING)).toBe(
      true,
    );
    expect(canTransitionApplicationStage(ApplicationStage.SCREENING, ApplicationStage.INTERVIEW)).toBe(
      true,
    );
    expect(canTransitionApplicationStage(ApplicationStage.INTERVIEW, ApplicationStage.OFFER)).toBe(
      true,
    );
    expect(canTransitionApplicationStage(ApplicationStage.OFFER, ApplicationStage.HIRED)).toBe(true);
  });

  it('allows rejecting or withdrawing from any active stage', () => {
    for (const stage of [
      ApplicationStage.APPLIED,
      ApplicationStage.SCREENING,
      ApplicationStage.INTERVIEW,
      ApplicationStage.OFFER,
    ]) {
      expect(canTransitionApplicationStage(stage, ApplicationStage.REJECTED)).toBe(true);
      expect(canTransitionApplicationStage(stage, ApplicationStage.WITHDRAWN)).toBe(true);
    }
  });

  it('rejects skipping stages forward', () => {
    expect(canTransitionApplicationStage(ApplicationStage.APPLIED, ApplicationStage.INTERVIEW)).toBe(
      false,
    );
    expect(canTransitionApplicationStage(ApplicationStage.APPLIED, ApplicationStage.HIRED)).toBe(
      false,
    );
  });

  it('rejects hiring from any stage other than OFFER', () => {
    expect(canTransitionApplicationStage(ApplicationStage.APPLIED, ApplicationStage.HIRED)).toBe(
      false,
    );
    expect(canTransitionApplicationStage(ApplicationStage.INTERVIEW, ApplicationStage.HIRED)).toBe(
      false,
    );
  });

  it('treats HIRED, REJECTED, and WITHDRAWN as terminal', () => {
    expect(canTransitionApplicationStage(ApplicationStage.HIRED, ApplicationStage.APPLIED)).toBe(
      false,
    );
    expect(canTransitionApplicationStage(ApplicationStage.REJECTED, ApplicationStage.APPLIED)).toBe(
      false,
    );
    expect(canTransitionApplicationStage(ApplicationStage.WITHDRAWN, ApplicationStage.APPLIED)).toBe(
      false,
    );
  });

  it('rejects a no-op transition to the same stage', () => {
    expect(canTransitionApplicationStage(ApplicationStage.APPLIED, ApplicationStage.APPLIED)).toBe(
      false,
    );
  });
});
