import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { WeeklyReportTemplateService } from './weekly-report-template.service';
import { UpsertWeeklyReportTemplateDto } from './dto/upsert-weekly-report-template.dto';
import { WeeklyReportTemplateResponseDto } from './dto/weekly-report-template-response.dto';

/**
 * Setting up each department's weekly report questions - Group HR/Tenant
 * Admin only (WeeklyReportTemplateService rejects UNIT_ADMIN even though it
 * holds WEEKLY_REPORT_MANAGE, same permission split as
 * WeeklyReportController's head-review surface).
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequirePermissions(Permission.WEEKLY_REPORT_MANAGE)
@RequireAddOn(AddOnModule.INTRANET)
@Controller('tenants/:tenantId/weekly-report-templates')
export class WeeklyReportTemplateController {
  constructor(private readonly templates: WeeklyReportTemplateService) {}

  @Get()
  @ApiOkResponse({ type: WeeklyReportTemplateResponseDto, isArray: true })
  listAll(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.templates.listAll(tenantId);
  }

  @Get(':organizationUnitId')
  @ApiOkResponse({ type: WeeklyReportTemplateResponseDto })
  getForUnit(
    @Param('tenantId') tenantId: string,
    @Param('organizationUnitId') organizationUnitId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.getForOrganizationUnit(tenantId, organizationUnitId);
  }

  @Put(':organizationUnitId')
  @ApiOkResponse({ type: WeeklyReportTemplateResponseDto })
  upsert(
    @Param('tenantId') tenantId: string,
    @Param('organizationUnitId') organizationUnitId: string,
    @Body() dto: UpsertWeeklyReportTemplateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.templates.upsert(tenantId, organizationUnitId, dto.questions, actor);
  }
}
