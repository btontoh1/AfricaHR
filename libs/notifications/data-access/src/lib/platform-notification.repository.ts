import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface NotificationDeliveryCounts {
  sent: number;
  failed: number;
  pending: number;
}

export interface FailedNotification {
  id: string;
  tenantId: string;
  tenantName: string | null;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  subject: string;
  failureReason: string | null;
  createdAt: Date;
}

interface RawDeliveryCountsRow {
  sent: string;
  failed: string;
  pending: string;
}

/**
 * Platform-admin, cross-tenant EMAIL delivery visibility. "notifications"
 * has a non-nullable tenant_id, so it uses the plain tenant_isolation RLS
 * policy (RLS_CONVENTION.md §2) - unlike the nullable-tenant §4 case, that
 * policy has no platform-sentinel branch, so withPlatformScope would
 * silently return zero rows here. Both methods go through SECURITY
 * DEFINER SQL functions (§5), the same pattern as
 * PayrollDisbursementRepository.
 */
@Injectable()
export class PlatformNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryCounts(): Promise<NotificationDeliveryCounts> {
    const rows = await this.prisma.$queryRaw<
      RawDeliveryCountsRow[]
    >`SELECT * FROM platform_notification_delivery_counts()`;
    const row = rows[0];
    return {
      sent: row ? Number(row.sent) : 0,
      failed: row ? Number(row.failed) : 0,
      pending: row ? Number(row.pending) : 0,
    };
  }

  listFailedNotifications(limit: number): Promise<FailedNotification[]> {
    return this.prisma.$queryRaw<
      FailedNotification[]
    >`SELECT * FROM platform_list_failed_notifications(${limit})`;
  }
}
