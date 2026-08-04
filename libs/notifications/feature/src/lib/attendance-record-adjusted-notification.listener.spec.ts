import { AttendanceRecordAdjustedNotificationListener } from './attendance-record-adjusted-notification.listener';
import { NotificationService } from './notification.service';

describe('AttendanceRecordAdjustedNotificationListener', () => {
  let listener: AttendanceRecordAdjustedNotificationListener;
  let notifications: jest.Mocked<NotificationService>;

  const basePayload = {
    tenantId: 'tenant-1',
    employeeUserId: 'emp-1-user',
    date: '2026-02-02',
    clockIn: '2026-02-02T08:00:00.000Z',
    clockOut: '2026-02-02T17:00:00.000Z',
    action: 'created' as const,
  };

  beforeEach(() => {
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;
    listener = new AttendanceRecordAdjustedNotificationListener(notifications);
  });

  it('sends an IN_APP notification when a record is created', async () => {
    await listener.handleAttendanceRecordAdjusted(basePayload);

    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'emp-1-user',
      channel: 'IN_APP',
      subject: 'An attendance record was added for 2026-02-02',
      body: 'Clock in 2026-02-02T08:00:00.000Z · Clock out 2026-02-02T17:00:00.000Z',
    });
  });

  it('uses an "updated" subject when the action is updated', async () => {
    await listener.handleAttendanceRecordAdjusted({ ...basePayload, action: 'updated' });

    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ subject: 'Your attendance record for 2026-02-02 was updated' }),
    );
  });

  it('falls back to a generic body when clock in/out is missing', async () => {
    await listener.handleAttendanceRecordAdjusted({ ...basePayload, clockIn: null, clockOut: null });

    expect(notifications.send).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ body: 'Reviewed by HR.' }),
    );
  });

  it('swallows a dispatch failure and does not throw', async () => {
    notifications.send.mockRejectedValue(new Error('boom'));

    await expect(listener.handleAttendanceRecordAdjusted(basePayload)).resolves.toBeUndefined();
  });
});
