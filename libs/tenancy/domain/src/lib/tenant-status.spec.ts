import { canTransitionTenantStatus, assertValidTenantStatusTransition, TenantStatus } from './tenant-status';

describe('tenant status transitions', () => {
  it.each([
    [TenantStatus.TRIAL, TenantStatus.ACTIVE, true],
    [TenantStatus.TRIAL, TenantStatus.CLOSED, true],
    [TenantStatus.TRIAL, TenantStatus.SUSPENDED, false],
    [TenantStatus.ACTIVE, TenantStatus.SUSPENDED, true],
    [TenantStatus.ACTIVE, TenantStatus.CLOSED, true],
    [TenantStatus.ACTIVE, TenantStatus.TRIAL, false],
    [TenantStatus.SUSPENDED, TenantStatus.ACTIVE, true],
    [TenantStatus.SUSPENDED, TenantStatus.CLOSED, true],
    [TenantStatus.CLOSED, TenantStatus.ACTIVE, false],
    [TenantStatus.CLOSED, TenantStatus.TRIAL, false],
  ])('%s -> %s allowed = %s', (from, to, expected) => {
    expect(canTransitionTenantStatus(from, to)).toBe(expected);
  });

  it('rejects a transition to the same status', () => {
    expect(canTransitionTenantStatus(TenantStatus.ACTIVE, TenantStatus.ACTIVE)).toBe(false);
  });

  it('assertValidTenantStatusTransition throws on an illegal transition', () => {
    expect(() =>
      assertValidTenantStatusTransition(TenantStatus.CLOSED, TenantStatus.ACTIVE),
    ).toThrow(/Cannot transition/);
  });

  it('assertValidTenantStatusTransition does not throw on a legal transition', () => {
    expect(() =>
      assertValidTenantStatusTransition(TenantStatus.TRIAL, TenantStatus.ACTIVE),
    ).not.toThrow();
  });
});
