import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationTemplate, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { NotificationTemplateRepository } from '@africahr/notifications-data-access';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@Injectable()
export class NotificationTemplateService {
  constructor(
    private readonly templates: NotificationTemplateRepository,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateNotificationTemplateDto,
    actorId?: string,
  ): Promise<NotificationTemplate> {
    let template: NotificationTemplate;
    try {
      template = await this.templates.create(tenantId, {
        code: dto.code,
        name: dto.name,
        channel: dto.channel,
        subjectTemplate: dto.subjectTemplate,
        bodyTemplate: dto.bodyTemplate,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Notification template code "${dto.code}" already exists`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'notifications.template.created',
      resourceType: 'NotificationTemplate',
      resourceId: template.id,
    });

    return template;
  }

  async findById(tenantId: string, id: string): Promise<NotificationTemplate> {
    const template = await this.templates.findById(tenantId, id);
    if (!template) {
      throw new NotFoundException(`Notification template "${id}" not found`);
    }
    return template;
  }

  list(tenantId: string, params: { activeOnly?: boolean } = {}): Promise<NotificationTemplate[]> {
    return this.templates.list(tenantId, params);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateNotificationTemplateDto,
    actorId?: string,
  ): Promise<NotificationTemplate> {
    await this.findById(tenantId, id);

    const updated = await this.templates.update(tenantId, id, {
      name: dto.name,
      subjectTemplate: dto.subjectTemplate,
      bodyTemplate: dto.bodyTemplate,
      isActive: dto.isActive,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'notifications.template.updated',
      resourceType: 'NotificationTemplate',
      resourceId: id,
    });

    return updated;
  }
}
