import { Injectable } from '@nestjs/common';
import { Notification, NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateNotificationInput {
  userId: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  status: NotificationStatus;
  sentAt?: Date;
  createdBy?: string;
}

export interface UpdateNotificationInput {
  status?: NotificationStatus;
  sentAt?: Date;
  failureReason?: string;
  isRead?: boolean;
  readAt?: Date;
  updatedBy?: string;
}

export interface ListNotificationsParams {
  userId?: string;
  status?: NotificationStatus;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notification.create({
        data: {
          tenantId,
          userId: input.userId,
          channel: input.channel,
          subject: input.subject,
          body: input.body,
          status: input.status,
          sentAt: input.sentAt,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<Notification | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notification.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListNotificationsParams = {}): Promise<Notification[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notification.findMany({
        where: {
          tenantId,
          deletedAt: null,
          userId: params.userId,
          status: params.status,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  update(tenantId: string, id: string, input: UpdateNotificationInput): Promise<Notification> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notification.update({
        where: { id },
        data: {
          status: input.status,
          sentAt: input.sentAt,
          failureReason: input.failureReason,
          isRead: input.isRead,
          readAt: input.readAt,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  softDelete(tenantId: string, id: string, updatedBy?: string): Promise<Notification> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notification.update({ where: { id }, data: { deletedAt: new Date(), updatedBy } }),
    );
  }
}
