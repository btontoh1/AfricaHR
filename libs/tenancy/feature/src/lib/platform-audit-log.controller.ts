import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformAuditLogService } from './platform-audit-log.service';
import { AuditLogPageResponseDto } from './dto/audit-log-response.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_AUDIT_READ)
@Controller('platform-admin/audit-logs')
export class PlatformAuditLogController {
  constructor(private readonly auditLogs: PlatformAuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Cross-tenant audit trail for the platform admin dashboard' })
  @ApiOkResponse({ type: AuditLogPageResponseDto })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'actorUserId', required: false })
  @ApiQuery({ name: 'action', required: false, description: 'Partial match, e.g. "role_changed"' })
  @ApiQuery({ name: 'resourceType', required: false, description: 'Partial match' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO 8601 timestamp, inclusive' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO 8601 timestamp, inclusive' })
  @ApiQuery({ name: 'limit', required: false, description: 'Default 50, max 200' })
  @ApiQuery({ name: 'offset', required: false, description: 'Default 0' })
  list(
    @Query('tenantId') tenantId?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditLogs.list({
      tenantId,
      actorUserId,
      action,
      resourceType,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
