import { Injectable } from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface NotificationRecipient {
  id: string;
  email: string;
}

/**
 * Reads only the User fields notification delivery needs. scope:notifications
 * cannot import iam-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "users" table directly through
 * PrismaService — same cross-bounded-context read pattern used by every
 * module since Payroll (Module 4). Needed specifically for the EMAIL
 * channel, which has to resolve an actual email address; the IN_APP
 * channel never needs this since the notification row itself is the
 * delivery.
 */
@Injectable()
export class NotificationUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, userId: string): Promise<NotificationRecipient | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.findFirst({
        where: { id: userId, tenantId, deletedAt: null },
        select: { id: true, email: true },
      }),
    );
  }

  /**
   * Active user ids in a tenant holding any of the given roles - used to
   * notify whoever can act on a request tenant-wide (e.g. leave approval:
   * TENANT_ADMIN/HR_MANAGER) alongside whatever specific person it's
   * routed to, without scope:notifications importing iam-feature's
   * role/permission logic.
   */
  async listActiveUserIdsByRole(tenantId: string, roles: SystemRole[]): Promise<string[]> {
    const users = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.user.findMany({
        where: { tenantId, role: { in: roles }, isActive: true, deletedAt: null },
        select: { id: true },
      }),
    );
    return users.map((user) => user.id);
  }
}
