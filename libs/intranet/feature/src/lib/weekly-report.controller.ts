import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { WeeklyReportService } from './weekly-report.service';
import { AddWeeklyReportCommentDto } from './dto/add-weekly-report-comment.dto';
import { WeeklyReportResponseDto } from './dto/weekly-report-response.dto';
import { WeeklyReportCommentResponseDto } from './dto/weekly-report-comment-response.dto';

/**
 * Reviewing submitted reports and commenting on them. A UNIT_ADMIN is
 * locked to their own department here (WeeklyReportService), while
 * PLATFORM_ADMIN/TENANT_ADMIN/HR_MANAGER may drill into any department or
 * see the tenant-wide summary - same split as AnnouncementController.
 * Submitting one's own report is a separate self-service surface (see
 * MyWeeklyReportController), registered before this controller so its
 * literal "/me" path is matched before this one's dynamic "/:id" route.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.WEEKLY_REPORT_MANAGE)
@Controller('tenants/:tenantId/weekly-reports')
export class WeeklyReportController {
  constructor(private readonly reports: WeeklyReportService) {}

  @Get()
  @ApiQuery({ name: 'organizationUnitId', required: false })
  @ApiQuery({ name: 'weekStart', required: false, description: 'Any date within the week - omit for every week.' })
  @ApiOkResponse({ type: WeeklyReportResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationUnitId') organizationUnitId?: string,
    @Query('weekStart') weekStart?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.listForReview(tenantId, actor, organizationUnitId, weekStart);
  }

  @Get(':id')
  @ApiOkResponse({ type: WeeklyReportResponseDto })
  get(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reports.getById(tenantId, actor, id);
  }

  @Get(':id/comments')
  @ApiOkResponse({ type: WeeklyReportCommentResponseDto, isArray: true })
  listComments(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reports.listComments(tenantId, actor, id);
  }

  @Post(':id/comments')
  @ApiOkResponse({ type: WeeklyReportCommentResponseDto })
  addComment(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddWeeklyReportCommentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.reports.addComment(tenantId, actor, id, dto.body);
  }
}
