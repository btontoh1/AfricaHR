import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { PayRunNotificationListener } from './pay-run-notification.listener';
import { NotificationService } from './notification.service';

describe('PayRunNotificationListener', () => {
  let listener: PayRunNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    payRunId: 'run-1',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    employeeCount: 12,
    actorUserId: 'mgr-1',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new PayRunNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to every tenant admin/payroll manager other than the actor', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'mgr-1']);

    await listener.handlePayRunProcessed(basePayload);

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.PAYROLL_MANAGER,
    ]);
    // 'mgr-1' is both a recipient and the actor - excluded, so only 1 send.
    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'admin-1',
      channel: 'IN_APP',
      subject: 'Pay run for 2026-01-01 to 2026-01-31 is ready for approval',
      body: '12 payslip(s) computed.',
    });
  });

  it('notifies no one and does not throw when there are no admins', async () => {
    await expect(listener.handlePayRunProcessed(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('does not notify the actor even when they are the only recipient', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['mgr-1']);

    await listener.handlePayRunProcessed(basePayload);

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('swallows a dispatch failure for one recipient without skipping the others', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'admin-2']);
    notifications.send.mockImplementation(async (_tenantId, dto) => {
      if (dto.userId === 'admin-1') {
        throw new Error('boom');
      }
      return {} as Awaited<ReturnType<NotificationService['send']>>;
    });

    await expect(listener.handlePayRunProcessed(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-2' }));
  });

  it('swallows a failure looking up recipients and does not throw', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await expect(listener.handlePayRunProcessed(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });
});
