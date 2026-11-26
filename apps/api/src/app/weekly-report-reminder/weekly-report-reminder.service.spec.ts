import { NotificationChannel } from '@prisma/client';
import { EmployeeMissingWeeklyReport, WeeklyReportReminderRepository } from '@africahr/intranet-data-access';
import { NotificationService } from '@africahr/notifications-feature';
import { WeeklyReportReminderService } from './weekly-report-reminder.service';

describe('WeeklyReportReminderService', () => {
  let service: WeeklyReportReminderService;
  let reminders: jest.Mocked<WeeklyReportReminderRepository>;
  let notifications: jest.Mocked<NotificationService>;

  const missing: EmployeeMissingWeeklyReport[] = [
    { tenantId: 'tenant-1', userId: 'user-1', employeeId: 'employee-1', firstName: 'Ama' },
    { tenantId: 'tenant-2', userId: 'user-2', employeeId: 'employee-2', firstName: 'Kwame' },
  ];

  beforeEach(() => {
    reminders = { findEmployeesMissingReport: jest.fn() } as unknown as jest.Mocked<WeeklyReportReminderRepository>;
    notifications = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NotificationService>;

    service = new WeeklyReportReminderService(reminders, notifications);
  });

  it('sends an in-app reminder to every employee missing a submission', async () => {
    reminders.findEmployeesMissingReport.mockResolvedValue(missing);

    await service.sendReminders();

    expect(notifications.send).toHaveBeenCalledTimes(2);
    expect(notifications.send).toHaveBeenCalledWith('tenant-1', {
      userId: 'user-1',
      channel: NotificationChannel.IN_APP,
      subject: 'Weekly report reminder',
      body: expect.stringContaining('Ama'),
      linkPath: '/intranet/my-weekly-reports',
    });
  });

  it('keeps sending to other employees when one notification fails', async () => {
    reminders.findEmployeesMissingReport.mockResolvedValue(missing);
    notifications.send.mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(undefined as never);

    await service.sendReminders();

    expect(notifications.send).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the lookup itself fails', async () => {
    reminders.findEmployeesMissingReport.mockRejectedValue(new Error('db down'));

    await service.sendReminders();

    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('sends nothing when every employee has already submitted', async () => {
    reminders.findEmployeesMissingReport.mockResolvedValue([]);

    await service.sendReminders();

    expect(notifications.send).not.toHaveBeenCalled();
  });
});
