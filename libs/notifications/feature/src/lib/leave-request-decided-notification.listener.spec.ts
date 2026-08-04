import { LeaveRequestDecidedNotificationListener } from './leave-request-decided-notification.listener';
import { NotificationService } from './notification.service';

describe('LeaveRequestDecidedNotificationListener', () => {
  let listener: LeaveRequestDecidedNotificationListener;
  let notifications: jest.Mocked<NotificationService>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeUserId: 'emp-1-user',
    leaveTypeName: 'Annual Leave',
    startDate: '2026-02-02',
    endDate: '2026-02-06',
    status: 'APPROVED' as const,
    rejectionReason: null,
    actorUserId: 'mgr-user-1',
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    listener = new LeaveRequestDecidedNotificationListener(notifications);
  });

  it('sends an IN_APP notification to the employee when approved', async () => {
    await listener.handleLeaveRequestDecided(basePayload);

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'emp-1-user',
      channel: 'IN_APP',
      subject: 'Your Annual Leave request was approved',
      body: '2026-02-02 to 2026-02-06.',
    });
  });

  it('includes the rejection reason in the body when rejected', async () => {
    await listener.handleLeaveRequestDecided({
      ...basePayload,
      status: 'REJECTED',
      rejectionReason: 'Insufficient coverage',
    });

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'emp-1-user',
      channel: 'IN_APP',
      subject: 'Your Annual Leave request was rejected',
      body: '2026-02-02 to 2026-02-06. Insufficient coverage',
    });
  });

  it('does not notify the employee when they cancelled their own request', async () => {
    await listener.handleLeaveRequestDecided({
      ...basePayload,
      status: 'CANCELLED',
      actorUserId: 'emp-1-user',
    });

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('notifies the employee when someone else cancelled the request on their behalf', async () => {
    await listener.handleLeaveRequestDecided({
      ...basePayload,
      status: 'CANCELLED',
      actorUserId: 'hr-1',
    });

    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ userId: 'emp-1-user' }),
    );
  });

  it('notifies the employee when there is no actor at all', async () => {
    await listener.handleLeaveRequestDecided({ ...basePayload, actorUserId: null });

    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ userId: 'emp-1-user' }),
    );
  });

  it('swallows a dispatch failure and does not throw', async () => {
    notifications.send.mockRejectedValue(new Error('boom'));

    await expect(listener.handleLeaveRequestDecided(basePayload)).resolves.toBeUndefined();
  });
});
