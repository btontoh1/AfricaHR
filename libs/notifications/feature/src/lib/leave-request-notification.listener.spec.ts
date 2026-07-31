import { LeaveRequestNotificationListener } from './leave-request-notification.listener';
import { NotificationService } from './notification.service';

describe('LeaveRequestNotificationListener', () => {
  let listener: LeaveRequestNotificationListener;
  let notifications: jest.Mocked<NotificationService>;

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    listener = new LeaveRequestNotificationListener(notifications);
  });

  it('sends an IN_APP notification to the manager', async () => {
    await listener.handleLeaveRequestCreated({
      tenantId: 'tenant-1',
      managerUserId: 'mgr-user-1',
      employeeName: 'Kwame Asante',
      leaveTypeName: 'Annual Leave',
      startDate: '2026-02-02',
      endDate: '2026-02-06',
    });

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'mgr-user-1',
      channel: 'IN_APP',
      subject: 'New leave request from Kwame Asante',
      body: 'Annual Leave, 2026-02-02 to 2026-02-06. Awaiting your approval.',
    });
  });

  it('swallows a dispatch failure rather than propagating it', async () => {
    notifications.send.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleLeaveRequestCreated({
        tenantId: 'tenant-1',
        managerUserId: 'mgr-user-1',
        employeeName: 'Kwame Asante',
        leaveTypeName: 'Annual Leave',
        startDate: '2026-02-02',
        endDate: '2026-02-06',
      }),
    ).resolves.toBeUndefined();
  });
});
