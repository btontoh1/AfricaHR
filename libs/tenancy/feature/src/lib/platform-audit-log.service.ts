import { Injectable } from '@nestjs/common';
import {
  AuditLogListFilters,
  AuditLogPage,
  AuditLogRepository,
} from '@africahr/tenancy-data-access';

export interface PlatformAuditLogQuery extends AuditLogListFilters {
  limit?: number;
  offset?: number;
}

/**
 * Read side of the platform-wide audit trail - AuditService (writes) has
 * no reader anywhere in the codebase today, leaving every recorded
 * tenant.created/user.role_changed/organization.verified/etc. entry
 * write-only. Platform-admin only (PLATFORM_AUDIT_READ): the trail spans
 * every tenant, so browsing it is an ops/security capability.
 */
@Injectable()
export class PlatformAuditLogService {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  list({ limit, offset, ...filters }: PlatformAuditLogQuery): Promise<AuditLogPage> {
    return this.auditLogs.list(filters, limit, offset);
  }
}
