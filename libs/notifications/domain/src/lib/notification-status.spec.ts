import { canMarkRead, NotificationStatus } from './notification-status';

describe('canMarkRead', () => {
  it('allows marking a SENT notification as read', () => {
    expect(canMarkRead(NotificationStatus.SENT)).toBe(true);
  });

  it('rejects marking a still-PENDING notification as read', () => {
    expect(canMarkRead(NotificationStatus.PENDING)).toBe(false);
  });

  it('rejects marking a FAILED notification as read', () => {
    expect(canMarkRead(NotificationStatus.FAILED)).toBe(false);
  });
});
