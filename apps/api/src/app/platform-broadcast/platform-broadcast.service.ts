import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { UserRepository, ActiveTenantAdmin } from '@africahr/iam-data-access';
import { NotificationService } from '@africahr/notifications-feature';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser } from '@africahr/platform-auth';
import { BroadcastResultDto } from './dto/broadcast-result.dto';

/**
 * Orchestrates a platform-wide broadcast (e.g. "the Terms of Service
 * changed") to every tenant's TENANT_ADMIN at once. Lives at the app level,
 * not in notifications-feature or iam-data-access, because those libs'
 * scope:notifications/scope:iam Nx tags can't depend on each other directly
 * - same reasoning as TenantAuthService/SetupService living here.
 */
@Injectable()
export class PlatformBroadcastService {
  private readonly logger = new Logger(PlatformBroadcastService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  async broadcastToTenantAdmins(subject: string, body: string, actor: RequestUser): Promise<BroadcastResultDto> {
    const admins = await this.users.findActiveTenantAdmins();

    const failureCount = await this.deliverToAll(admins, subject, body, actor.sub);

    // Platform-level, not per-tenant: this action isn't scoped to one
    // tenant, it's the platform admin reaching every tenant at once (see
    // RecordAuditEntryInput.tenantId's documented null case).
    await this.audit.record({
      tenantId: null,
      actorUserId: actor.sub,
      action: 'platform.notification_broadcast_sent',
      resourceType: 'Tenant',
      metadata: { subject, recipientCount: admins.length, failureCount },
    });

    return { recipientCount: admins.length, failureCount };
  }

  /**
   * Promise.allSettled, not Promise.all: one tenant's failed email/in-app
   * delivery (e.g. a bad SendGrid response) must never abort delivery to
   * every other tenant - same "each one degrades independently" posture as
   * PlatformDashboardService's summary metrics.
   */
  private async deliverToAll(
    admins: ActiveTenantAdmin[],
    subject: string,
    body: string,
    actorId: string,
  ): Promise<number> {
    const results = await Promise.allSettled(
      admins.flatMap((admin) => [
        this.notifications.send(admin.tenantId, { userId: admin.id, channel: NotificationChannel.EMAIL, subject, body }, actorId),
        this.notifications.send(admin.tenantId, { userId: admin.id, channel: NotificationChannel.IN_APP, subject, body }, actorId),
      ]),
    );

    let failureCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failureCount += 1;
        const admin = admins[Math.floor(index / 2)];
        this.logger.error(`Failed to deliver broadcast to tenant "${admin.tenantId}" user "${admin.id}"`, result.reason as Error);
      }
    });
    return failureCount;
  }
}
