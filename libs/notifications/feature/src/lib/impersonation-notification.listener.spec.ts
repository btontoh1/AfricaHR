import { ImpersonationNotificationListener } from './impersonation-notification.listener';
import { NotificationService } from './notification.service';

describe('ImpersonationNotificationListener', () => {
  let listener: ImpersonationNotificationListener;
  let notifications: jest.Mocked<NotificationService>;

  const payload = {
    tenantId: 'tenant-1',
    targetUserId: 'user-2',
    actingAdminId: 'admin-1',
    reason: 'Investigating payroll error #412',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    listener = new ImpersonationNotificationListener(notifications);
  });

  it('notifies the impersonated user both IN_APP and by EMAIL, attributed to the acting admin', async () => {
    await listener.handleImpersonationStarted(payload);

    expect(notifications.send).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        userId: 'user-2',
        channel: 'IN_APP',
        subject: 'Account access notice',
        body: expect.stringContaining('Investigating payroll error #412'),
      }),
      'admin-1',
    );
    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ userId: 'user-2', channel: 'EMAIL' }),
      'admin-1',
    );
  });

  it('sends the other channel even when one dispatch fails', async () => {
    notifications.send.mockRejectedValueOnce(new Error('SendGrid down')).mockResolvedValueOnce(undefined as never);

    await expect(listener.handleImpersonationStarted(payload)).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledTimes(2);
  });
});
