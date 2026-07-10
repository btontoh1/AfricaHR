import { ConflictException, NotFoundException } from '@nestjs/common';
import { NotificationTemplate, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { NotificationTemplateRepository } from '@africahr/notifications-data-access';
import { NotificationTemplateService } from './notification-template.service';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;
  let templates: jest.Mocked<NotificationTemplateRepository>;
  let audit: jest.Mocked<AuditService>;

  function makeTemplate(overrides: Partial<NotificationTemplate> = {}): NotificationTemplate {
    return {
      id: 'tmpl-1',
      tenantId: 'tenant-1',
      code: 'LEAVE_APPROVED',
      name: 'Leave Approved',
      channel: 'IN_APP',
      subjectTemplate: 'Leave approved',
      bodyTemplate: 'Hi {{firstName}}',
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
    templates = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<NotificationTemplateRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new NotificationTemplateService(templates, audit);
  });

  describe('create', () => {
    it('translates a duplicate code into ConflictException', async () => {
      templates.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', {
          code: 'LEAVE_APPROVED',
          name: 'Leave Approved',
          channel: 'IN_APP',
          subjectTemplate: 'x',
          bodyTemplate: 'y',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the template and audits on success', async () => {
      const created = makeTemplate();
      templates.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { code: 'LEAVE_APPROVED', name: 'Leave Approved', channel: 'IN_APP', subjectTemplate: 'x', bodyTemplate: 'y' },
        'hr-1',
      );

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'notifications.template.created', resourceId: created.id }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      templates.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      templates.findById.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'missing', { isActive: false })).rejects.toThrow(
        NotFoundException,
      );
      expect(templates.update).not.toHaveBeenCalled();
    });

    it('updates the template and audits on success', async () => {
      templates.findById.mockResolvedValue(makeTemplate());
      templates.update.mockResolvedValue(makeTemplate({ isActive: false }));

      await service.update('tenant-1', 'tmpl-1', { isActive: false }, 'hr-1');

      expect(templates.update).toHaveBeenCalledWith(
        'tenant-1',
        'tmpl-1',
        expect.objectContaining({ isActive: false }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'notifications.template.updated' }),
      );
    });
  });
});
