import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { BenefitEnrollmentCancelledNotificationListener } from './benefit-enrollment-cancelled-notification.listener';
import { NotificationService } from './notification.service';

describe('BenefitEnrollmentCancelledNotificationListener', () => {
  let listener: BenefitEnrollmentCancelledNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeName: 'Kwame Asante',
    planName: 'Private Health Insurance',
    actorUserId: 'hr-1',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new BenefitEnrollmentCancelledNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to every tenant admin/HR manager other than the actor', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'hr-1']);

    await listener.handleEnrollmentCancelled(basePayload);

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.HR_MANAGER,
    ]);
    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'admin-1',
      channel: 'IN_APP',
      subject: 'Kwame Asante cancelled Private Health Insurance',
      body: 'Enrollment cancelled.',
    });
  });

  it('notifies no one and does not throw when there are no admins', async () => {
    await expect(listener.handleEnrollmentCancelled(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('does not notify the actor even when they are the only admin', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['hr-1']);

    await listener.handleEnrollmentCancelled(basePayload);

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

    await expect(listener.handleEnrollmentCancelled(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-2' }));
  });

  it('swallows a failure looking up recipients and does not throw', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await expect(listener.handleEnrollmentCancelled(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });
});
