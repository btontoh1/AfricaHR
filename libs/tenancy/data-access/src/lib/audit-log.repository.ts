import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface AuditLogListFilters {
  tenantId?: string;
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorFirstName: string | null;
  actorLastName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: Date;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  totalCount: number;
}

interface RawAuditLogRow extends AuditLogEntry {
  totalCount: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Platform-admin, cross-tenant audit log reads. "audit_logs" has a
 * nullable tenant_id (RLS_CONVENTION.md §4) - that policy only exempts
 * platform-admin-owned rows from RLS, it doesn't expose tenant-scoped
 * entries to a platform-scoped query, so this goes through the
 * platform_list_audit_logs() SECURITY DEFINER function (§5), the same
 * pattern as PlatformBillingRepository.
 */
@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: AuditLogListFilters, limit = DEFAULT_LIMIT, offset = 0): Promise<AuditLogPage> {
    const boundedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const boundedOffset = Math.max(offset, 0);

    const rows = await this.prisma.$queryRaw<RawAuditLogRow[]>`
      SELECT * FROM platform_list_audit_logs(
        ${filters.tenantId ?? null},
        ${filters.actorUserId ?? null},
        ${filters.action ?? null},
        ${filters.resourceType ?? null},
        ${filters.from ?? null},
        ${filters.to ?? null},
        ${boundedLimit},
        ${boundedOffset}
      )
    `;

    return {
      items: rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        tenantName: row.tenantName,
        actorUserId: row.actorUserId,
        actorEmail: row.actorEmail,
        actorFirstName: row.actorFirstName,
        actorLastName: row.actorLastName,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        metadata: row.metadata,
        createdAt: row.createdAt,
      })),
      totalCount: rows.length > 0 ? Number(rows[0].totalCount) : 0,
    };
  }
}
