import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformDashboardService } from './platform-dashboard.service';
import { PlatformDashboardSummaryDto } from './dto/platform-dashboard-summary.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_TENANT_MANAGE)
@Controller('platform-admin/dashboard')
export class PlatformDashboardController {
  constructor(private readonly dashboard: PlatformDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Operational overview for the platform admin dashboard' })
  @ApiOkResponse({ type: PlatformDashboardSummaryDto })
  get() {
    return this.dashboard.getSummary();
  }
}
