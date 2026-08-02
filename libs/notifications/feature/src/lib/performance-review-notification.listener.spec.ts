import { SystemRole } from '@prisma/client';
import { NotificationUserRepository } from '@africahr/notifications-data-access';
import { PerformanceReviewNotificationListener } from './performance-review-notification.listener';
import { NotificationService } from './notification.service';

describe('PerformanceReviewNotificationListener', () => {
  let listener: PerformanceReviewNotificationListener;
  let notifications: jest.Mocked<NotificationService>;
  let users: jest.Mocked<NotificationUserRepository>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeName: 'Kwame Asante',
    cycleName: 'Q1 2026 Review',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    users = { listActiveUserIdsByRole: jest.fn().mockResolvedValue([]) } as unknown as jest.Mocked<NotificationUserRepository>;
    listener = new PerformanceReviewNotificationListener(notifications, users);
  });

  it('sends an IN_APP notification to the manager', async () => {
    await listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: 'mgr-user-1' });

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'mgr-user-1',
      channel: 'IN_APP',
      subject: 'Kwame Asante submitted a self-assessment',
      body: 'Q1 2026 Review. Awaiting your review.',
    });
  });

  it('also notifies every tenant admin/HR manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1', 'hr-1']);

    await listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: 'mgr-user-1' });

    expect(users.listActiveUserIdsByRole).toHaveBeenCalledWith('tenant-1', [
      SystemRole.TENANT_ADMIN,
      SystemRole.HR_MANAGER,
    ]);
    expect(notifications.send).toHaveBeenCalledTimes(3);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-user-1' }));
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'hr-1' }));
  });

  it('still notifies tenant admins/HR managers when there is no manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['admin-1']);

    await listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: null });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('does not double-notify when the manager is also a tenant admin/HR manager', async () => {
    users.listActiveUserIdsByRole.mockResolvedValue(['mgr-user-1']);

    await listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: 'mgr-user-1' });

    expect(notifications.send).toHaveBeenCalledTimes(1);
  });

  it('notifies no one and does not throw when there is no manager and no admins', async () => {
    await expect(
      listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: null }),
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
      listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: 'mgr-user-1' }),
    ).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'admin-1' }));
  });

  it('swallows a failure looking up admin recipients and still notifies the manager', async () => {
    users.listActiveUserIdsByRole.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleSelfAssessmentSubmitted({ ...basePayload, managerUserId: 'mgr-user-1' }),
    ).resolves.toBeUndefined();

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', expect.objectContaining({ userId: 'mgr-user-1' }));
  });
});
