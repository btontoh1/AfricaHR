import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { PayrollDisbursementFailedNotificationListener } from './payroll-disbursement-failed-notification.listener';
import { NotificationService } from './notification.service';

describe('PayrollDisbursementFailedNotificationListener', () => {
  let listener: PayrollDisbursementFailedNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeName: 'Kwame Asante',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new PayrollDisbursementFailedNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to every tenant admin/payroll manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'mgr-1']);

    await listener.handleDisbursementFailed(basePayload);

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.PAYROLL_MANAGER,
    ]);
    expect(notifications.send).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'admin-1',
      channel: 'IN_APP',
      subject: 'Payment failed for Kwame Asante',
      body: "Could not disburse pay for the 2026-01-01 to 2026-01-31 pay run via Paystack - check the employee's payment details and retry.",
    });
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-1' }));
  });

  it('notifies no one and does not throw when there are no admins', async () => {
    await expect(listener.handleDisbursementFailed(basePayload)).resolves.toBeUndefined();

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

    await expect(listener.handleDisbursementFailed(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-2' }));
  });

  it('swallows a failure looking up recipients and does not throw', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await expect(listener.handleDisbursementFailed(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });
});
