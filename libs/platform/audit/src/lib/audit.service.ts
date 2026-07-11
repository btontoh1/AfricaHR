import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface RecordAuditEntryInput {
  /** null for platform-admin-initiated actions not scoped to a tenant. */
  tenantId: string | null;
  /** null for system-initiated actions (e.g. seed scripts). */
  actorUserId: string | null;
  /** e.g. "tenant.created", "user.role_changed" */
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Written via explicit calls from mutating service methods — not automatic
 * interceptor-based capture — so exactly what's logged stays predictable.
 * Deliberately fire-and-forget-safe: a logging failure must never fail the
 * business operation it's describing, so errors are caught and logged, not
 * rethrown.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditEntryInput): Promise<void> {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
    };

    try {
      if (input.tenantId) {
        await this.prisma.withTenantContext(input.tenantId, (tx) =>
          tx.auditLog.create({ data }),
        );
      } else {
        await this.prisma.withPlatformScope((tx) => tx.auditLog.create({ data }));
      }
    } catch (error) {
      this.logger.error(
        `Failed to record audit entry for ${input.action} on ${input.resourceType}: ${(error as Error).message}`,
      );
    }
  }
}
