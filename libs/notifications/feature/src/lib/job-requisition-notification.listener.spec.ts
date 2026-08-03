import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { JobRequisitionNotificationListener } from './job-requisition-notification.listener';
import { NotificationService } from './notification.service';

describe('JobRequisitionNotificationListener', () => {
  let listener: JobRequisitionNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    hiringManagerUserId: 'mgr-user-1',
    jobTitle: 'Software Engineer',
    actorUserId: 'hr-1',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new JobRequisitionNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to the hiring manager and every tenant admin/HR manager other than the actor', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'hr-1']);

    await listener.handleRequisitionCreated(basePayload);

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.HR_MANAGER,
    ]);
    // 'hr-1' is both an admin recipient and the actor - excluded.
    expect(notifications.send).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'mgr-user-1',
      channel: 'IN_APP',
      subject: 'New job requisition: Software Engineer',
      body: 'Ready for review.',
    });
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'admin-1',
      channel: 'IN_APP',
      subject: 'New job requisition: Software Engineer',
      body: 'Ready for review.',
    });
  });

  it('notifies only the admins when there is no hiring manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1']);

    await listener.handleRequisitionCreated({ ...basePayload, hiringManagerUserId: null });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('does not double-notify when the hiring manager is also an admin', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['mgr-user-1']);

    await listener.handleRequisitionCreated(basePayload);

    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

  it('does not notify the actor even when they are the hiring manager', async () => {
    await listener.handleRequisitionCreated({ ...basePayload, hiringManagerUserId: 'hr-1' });

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('notifies no one and does not throw when there is no hiring manager and no admins', async () => {
    await expect(
      listener.handleRequisitionCreated({ ...basePayload, hiringManagerUserId: null }),
    ).resolves.toBeUndefined();

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('swallows a dispatch failure for one recipient without skipping the others', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1']);
    notifications.send.mockImplementation(async (_tenantId, dto) => {
      if (dto.userId === 'mgr-user-1') {
        throw new Error('boom');
      }
      return {} as Awaited<ReturnType<NotificationService['send']>>;
    });

    await expect(listener.handleRequisitionCreated(basePayload)).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('still notifies the hiring manager when the admin lookup fails', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await listener.handleRequisitionCreated(basePayload);

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-user-1' }));
  });
});
