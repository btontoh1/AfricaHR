import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { RecruitmentPipelineReportService } from './recruitment-pipeline-report.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/reports/recruitment-pipeline')
export class RecruitmentPipelineReportController {
  constructor(private readonly pipeline: RecruitmentPipelineReportService) {}

  @Get()
  @RequirePermissions(Permission.REPORTING_READ)
  generate(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.pipeline.generate(tenantId, { organizationId });
  }
}
