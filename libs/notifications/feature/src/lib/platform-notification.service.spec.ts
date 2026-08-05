import { PlatformNotificationRepository } from '@africahr/notifications-data-access';
import { PlatformNotificationService } from './platform-notification.service';

describe('PlatformNotificationService', () => {
  let service: PlatformNotificationService;
  let notifications: jest.Mocked<PlatformNotificationRepository>;

  beforeEach(() => {
    notifications = {
      getDeliveryCounts: jest.fn(),
      listFailedNotifications: jest.fn(),
    } as unknown as jest.Mocked<PlatformNotificationRepository>;
    service = new PlatformNotificationService(notifications);
  });

  it('assembles counts and the recent-failures list together', async () => {
    notifications.getDeliveryCounts.mockResolvedValue({ sent: 100, failed: 2, pending: 1 });
    notifications.listFailedNotifications.mockResolvedValue([
      {
        id: 'notif-1',
        tenantId: 'tenant-1',
        tenantName: 'Acme Ghana Ltd',
        userId: 'user-1',
        userEmail: 'ama@acme-ghana.com',
        userFirstName: 'Ama',
        userLastName: 'Owusu',
        subject: 'Your leave request was approved',
        failureReason: 'SendGrid: invalid recipient',
        createdAt: new Date('2026-08-01T00:00:00Z'),
      },
    ]);

    const summary = await service.getDeliverySummary();

    expect(summary.counts).toEqual({ sent: 100, failed: 2, pending: 1 });
    expect(summary.failed).toHaveLength(1);
    expect(notifications.listFailedNotifications).toHaveBeenCalledWith(20);
  });
});
