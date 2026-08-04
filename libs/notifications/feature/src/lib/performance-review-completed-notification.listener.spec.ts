import { PerformanceReviewCompletedNotificationListener } from './performance-review-completed-notification.listener';
import { NotificationService } from './notification.service';

describe('PerformanceReviewCompletedNotificationListener', () => {
  let listener: PerformanceReviewCompletedNotificationListener;
  let notifications: jest.Mocked<NotificationService>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeUserId: 'emp-1-user',
    cycleName: 'Q1 2026 Review',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    listener = new PerformanceReviewCompletedNotificationListener(notifications);
  });

  it('sends an IN_APP notification to the reviewee', async () => {
    await listener.handleReviewCompleted(basePayload);

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'emp-1-user',
      channel: 'IN_APP',
      subject: 'Your performance review is complete',
      body: 'Q1 2026 Review. Your manager has submitted their assessment.',
    });
  });

  it('swallows a dispatch failure and does not throw', async () => {
    notifications.send.mockRejectedValue(new Error('boom'));

    await expect(listener.handleReviewCompleted(basePayload)).resolves.toBeUndefined();
  });
});
