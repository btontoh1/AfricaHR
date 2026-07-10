import { ConflictException, NotFoundException } from '@nestjs/common';
import { Notification, NotificationTemplate } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  NotificationRepository,
  NotificationTemplateRepository,
  NotificationUserRepository,
} from '@africahr/notifications-data-access';
import { NotificationDispatcher } from './notification-dispatcher';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let notifications: jest.Mocked<NotificationRepository>;
  let templates: jest.Mocked<NotificationTemplateRepository>;
  let users: jest.Mocked<NotificationUserRepository>;
  let dispatcher: jest.Mocked<NotificationDispatcher>;
  let audit: jest.Mocked<AuditService>;

  function makeNotification(overrides: Partial<Notification> = {}): Notification {
    return {
      id: 'notif-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      channel: 'IN_APP',
      subject: 'Subject',
      body: 'Body',
      status: 'SENT',
      isRead: false,
      readAt: null,
      sentAt: new Date(),
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as Notification;
  }

  function makeTemplate(overrides: Partial<NotificationTemplate> = {}): NotificationTemplate {
    return {
      id: 'tmpl-1',
      tenantId: 'tenant-1',
      code: 'LEAVE_APPROVED',
      name: 'Leave Approved',
      channel: 'IN_APP',
      subjectTemplate: 'Leave approved',
      bodyTemplate: 'Hi {{firstName}}, approved.',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as NotificationTemplate;
  }

  beforeEach(() => {
    notifications = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;

    templates = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<NotificationTemplateRepository>;

    users = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<NotificationUserRepository>;

    dispatcher = {
      dispatchEmail: jest.fn(),
    } as unknown as jest.Mocked<NotificationDispatcher>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new NotificationService(notifications, templates, users, dispatcher, audit);
  });

  describe('send — IN_APP', () => {
    it('creates the notification as SENT immediately, with no dispatcher call', async () => {
      const created = makeNotification();
      notifications.create.mockResolvedValue(created);

      await service.send(
        'tenant-1',
        { userId: 'user-1', channel: 'IN_APP', subject: 'Hi', body: 'Body' },
        'hr-1',
      );

      expect(notifications.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ status: 'SENT' }),
      );
      expect(dispatcher.dispatchEmail).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'notifications.notification.sent', resourceId: created.id }),
      );
    });
  });

  describe('send — EMAIL', () => {
    it('throws NotFoundException when the recipient user does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(
        service.send('tenant-1', { userId: 'missing', channel: 'EMAIL', subject: 'Hi', body: 'Body' }),
      ).rejects.toThrow(NotFoundException);
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('creates PENDING, dispatches, then marks SENT on success', async () => {
      users.findById.mockResolvedValue({ id: 'user-1', email: 'ama@example.com' });
      notifications.create.mockResolvedValue(makeNotification({ status: 'PENDING' }));
      dispatcher.dispatchEmail.mockResolvedValue({ success: true });
      notifications.update.mockResolvedValue(makeNotification({ status: 'SENT' }));

      await service.send('tenant-1', { userId: 'user-1', channel: 'EMAIL', subject: 'Hi', body: 'Body' });

      expect(dispatcher.dispatchEmail).toHaveBeenCalledWith('ama@example.com', 'Hi', 'Body');
      expect(notifications.update).toHaveBeenCalledWith(
        'tenant-1',
        'notif-1',
        expect.objectContaining({ status: 'SENT' }),
      );
    });

    it('marks FAILED with a failureReason when dispatch fails', async () => {
      users.findById.mockResolvedValue({ id: 'user-1', email: 'ama@example.com' });
      notifications.create.mockResolvedValue(makeNotification({ status: 'PENDING' }));
      dispatcher.dispatchEmail.mockResolvedValue({ success: false, failureReason: 'SMTP timeout' });
      notifications.update.mockResolvedValue(makeNotification({ status: 'FAILED' }));

      await service.send('tenant-1', { userId: 'user-1', channel: 'EMAIL', subject: 'Hi', body: 'Body' });

      expect(notifications.update).toHaveBeenCalledWith(
        'tenant-1',
        'notif-1',
        expect.objectContaining({ status: 'FAILED', failureReason: 'SMTP timeout' }),
      );
    });
  });

  describe('sendFromTemplate', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      templates.findById.mockResolvedValue(null);

      await expect(
        service.sendFromTemplate('tenant-1', { userId: 'user-1', templateId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects sending from an inactive template', async () => {
      templates.findById.mockResolvedValue(makeTemplate({ isActive: false }));

      await expect(
        service.sendFromTemplate('tenant-1', { userId: 'user-1', templateId: 'tmpl-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('renders the template with variables before dispatching', async () => {
      templates.findById.mockResolvedValue(makeTemplate());
      notifications.create.mockResolvedValue(makeNotification());

      await service.sendFromTemplate('tenant-1', {
        userId: 'user-1',
        templateId: 'tmpl-1',
        variables: { firstName: 'Ama' },
      });

      expect(notifications.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ subject: 'Leave approved', body: 'Hi Ama, approved.' }),
      );
    });
  });

  describe('listForSelf', () => {
    it('scopes the list to the caller userId', async () => {
      await service.listForSelf('tenant-1', 'user-1');

      expect(notifications.list).toHaveBeenCalledWith('tenant-1', { userId: 'user-1' });
    });
  });

  describe('markReadForSelf', () => {
    it('does not reveal a notification belonging to a different user', async () => {
      notifications.findById.mockResolvedValue(makeNotification({ userId: 'someone-else' }));

      await expect(service.markReadForSelf('tenant-1', 'user-1', 'notif-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(notifications.update).not.toHaveBeenCalled();
    });

    it('rejects marking a still-PENDING notification as read', async () => {
      notifications.findById.mockResolvedValue(
        makeNotification({ userId: 'user-1', status: 'PENDING' }),
      );

      await expect(service.markReadForSelf('tenant-1', 'user-1', 'notif-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('marks a SENT notification as read for its owner', async () => {
      notifications.findById.mockResolvedValue(makeNotification({ userId: 'user-1', status: 'SENT' }));
      notifications.update.mockResolvedValue(
        makeNotification({ userId: 'user-1', status: 'SENT', isRead: true }),
      );

      await service.markReadForSelf('tenant-1', 'user-1', 'notif-1');

      expect(notifications.update).toHaveBeenCalledWith(
        'tenant-1',
        'notif-1',
        expect.objectContaining({ isRead: true }),
      );
    });
  });
});
