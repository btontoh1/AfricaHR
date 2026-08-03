import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { RecruitmentApplicationNotificationListener } from './recruitment-application-notification.listener';
import { NotificationService } from './notification.service';

describe('RecruitmentApplicationNotificationListener', () => {
  let listener: RecruitmentApplicationNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    candidateName: 'Kwame Asante',
    jobTitle: 'Software Engineer',
    actorUserId: 'hr-1',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new RecruitmentApplicationNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to the hiring manager', async () => {
    await listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: 'mgr-user-1' });

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'mgr-user-1',
      channel: 'IN_APP',
      subject: 'New application from Kwame Asante',
      body: 'Applied for Software Engineer.',
    });
  });

  it('also notifies every tenant admin/HR manager other than the actor', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'hr-1']);

    await listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: 'mgr-user-1' });

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.HR_MANAGER,
    ]);
    // 'hr-1' is both an admin recipient and the actor - excluded, so only 2 sends.
    expect(notifications.send).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-user-1' }));
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
    expect(notifications.send).not.toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'hr-1' }));
  });

  it('does not notify the actor even when they are the hiring manager', async () => {
    await listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: 'hr-1' });

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('still notifies tenant admins/HR managers when there is no hiring manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1']);

    await listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: null });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('notifies no one and does not throw when there is no hiring manager and no admins', async () => {
    await expect(
      listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: null }),
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

    await expect(
      listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: 'mgr-user-1' }),
    ).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('swallows a failure looking up admin recipients and still notifies the hiring manager', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleApplicationCreated({ ...basePayload, hiringManagerUserId: 'mgr-user-1' }),
    ).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-user-1' }));
  });
});
