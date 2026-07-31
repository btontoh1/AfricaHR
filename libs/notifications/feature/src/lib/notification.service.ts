import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationChannel } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  NotificationRepository,
  NotificationTemplateRepository,
  NotificationUserRepository,
} from '@africahr/notifications-data-access';
import { canMarkRead, renderTemplate } from '@africahr/notifications-domain';
import { NotificationDispatcher } from './notification-dispatcher';
import { SendFromTemplateDto } from './dto/send-from-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly templates: NotificationTemplateRepository,
    private readonly users: NotificationUserRepository,
    private readonly dispatcher: NotificationDispatcher,
    private readonly audit: AuditService,
  ) {}

  async send(
    tenantId: string,
    dto: SendNotificationDto,
    actorId?: string,
  ): Promise<Notification> {
    return this.dispatch(tenantId, dto.userId, dto.channel, dto.subject, dto.body, actorId);
  }

  async sendFromTemplate(
    tenantId: string,
    dto: SendFromTemplateDto,
    actorId?: string,
  ): Promise<Notification> {
    const template = await this.templates.findById(tenantId, dto.templateId);
    if (!template) {
      throw new NotFoundException(`Notification template "${dto.templateId}" not found`);
    }
    if (!template.isActive) {
      throw new ConflictException(`Notification template "${dto.templateId}" is not active`);
    }

    const variables = dto.variables ?? {};
    const subject = renderTemplate(template.subjectTemplate, variables);
    const body = renderTemplate(template.bodyTemplate, variables);

    return this.dispatch(tenantId, dto.userId, template.channel, subject, body, actorId);
  }

  async findById(tenantId: string, id: string): Promise<Notification> {
    const notification = await this.notifications.findById(tenantId, id);
    if (!notification) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    return notification;
  }

  list(
    tenantId: string,
    params: { userId?: string; status?: Notification['status'] } = {},
  ): Promise<Notification[]> {
    return this.notifications.list(tenantId, params);
  }

  listForSelf(tenantId: string, userId: string): Promise<Notification[]> {
    return this.notifications.list(tenantId, { userId });
  }

  async markReadForSelf(tenantId: string, userId: string, id: string): Promise<Notification> {
    const notification = await this.findById(tenantId, id);
    // Ownership check via NotFoundException, not ForbiddenException — same
    // convention as every other self-service module, so a caller can't use
    // the error to distinguish "not yours" from "doesn't exist".
    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }
    if (!canMarkRead(notification.status)) {
      throw new ConflictException(`Cannot mark a ${notification.status} notification as read`);
    }

    return this.notifications.update(tenantId, id, { isRead: true, readAt: new Date() });
  }

  /**
   * Soft delete — deletedAt, not a row removal, matching every other
   * deletable record in this schema (see User.deletedAt). Keeps the
   * underlying notification around for audit/history purposes even though
   * it drops out of the recipient's own list() results (which already
   * filter on deletedAt: null).
   */
  async deleteForSelf(tenantId: string, userId: string, id: string): Promise<void> {
    const notification = await this.findById(tenantId, id);
    if (notification.userId !== userId) {
      throw new NotFoundException(`Notification "${id}" not found`);
    }

    await this.notifications.softDelete(tenantId, id, userId);

    await this.audit.record({
      tenantId,
      actorUserId: userId,
      action: 'notifications.notification.deleted',
      resourceType: 'Notification',
      resourceId: id,
    });
  }

  private async dispatch(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    subject: string,
    body: string,
    actorId?: string,
  ): Promise<Notification> {
    if (channel === 'IN_APP') {
      const notification = await this.notifications.create(tenantId, {
        userId,
        channel,
        subject,
        body,
        status: 'SENT',
        sentAt: new Date(),
        createdBy: actorId,
      });

      await this.audit.record({
        tenantId,
        actorUserId: actorId ?? null,
        action: 'notifications.notification.sent',
        resourceType: 'Notification',
        resourceId: notification.id,
        metadata: { channel, status: notification.status },
      });

      return notification;
    }

    const recipient = await this.users.findById(tenantId, userId);
    if (!recipient) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    const notification = await this.notifications.create(tenantId, {
      userId,
      channel,
      subject,
      body,
      status: 'PENDING',
      createdBy: actorId,
    });

    const result = await this.dispatcher.dispatchEmail(recipient.email, subject, body);

    const updated = await this.notifications.update(tenantId, notification.id, {
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : undefined,
      failureReason: result.success ? undefined : result.failureReason,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'notifications.notification.sent',
      resourceType: 'Notification',
      resourceId: notification.id,
      metadata: { channel, status: updated.status },
    });

    return updated;
  }
}
