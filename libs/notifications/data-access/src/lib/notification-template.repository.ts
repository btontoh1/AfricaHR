import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationTemplate } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateNotificationTemplateInput {
  code: string;
  name: string;
  channel: NotificationChannel;
  subjectTemplate: string;
  bodyTemplate: string;
  createdBy?: string;
}

export interface UpdateNotificationTemplateInput {
  name?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface ListNotificationTemplatesParams {
  activeOnly?: boolean;
}

@Injectable()
export class NotificationTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateNotificationTemplateInput): Promise<NotificationTemplate> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.create({
        data: {
          tenantId,
          code: input.code,
          name: input.name,
          channel: input.channel,
          subjectTemplate: input.subjectTemplate,
          bodyTemplate: input.bodyTemplate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<NotificationTemplate | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(
    tenantId: string,
    params: ListNotificationTemplatesParams = {},
  ): Promise<NotificationTemplate[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.findMany({
        where: { tenantId, deletedAt: null, isActive: params.activeOnly ? true : undefined },
        orderBy: { name: 'asc' },
      }),
    );
  }

  update(
    tenantId: string,
    id: string,
    input: UpdateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.notificationTemplate.update({
        where: { id },
        data: {
          name: input.name,
          subjectTemplate: input.subjectTemplate,
          bodyTemplate: input.bodyTemplate,
          isActive: input.isActive,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
