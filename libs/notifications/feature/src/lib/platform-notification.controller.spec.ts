import { PlatformNotificationController } from './platform-notification.controller';
import { NotificationDeliverySummary, PlatformNotificationService } from './platform-notification.service';

describe('PlatformNotificationController', () => {
  let controller: PlatformNotificationController;
  let notifications: jest.Mocked<PlatformNotificationService>;

  beforeEach(() => {
    notifications = {
      getDeliverySummary: jest.fn(),
    } as unknown as jest.Mocked<PlatformNotificationService>;
    controller = new PlatformNotificationController(notifications);
  });

  it('delegates to PlatformNotificationService.getDeliverySummary', async () => {
    const summary: NotificationDeliverySummary = {
      counts: { sent: 0, failed: 0, pending: 0 },
      failed: [],
    };
    notifications.getDeliverySummary.mockResolvedValue(summary);

    await expect(controller.get()).resolves.toEqual(summary);
  });
});
