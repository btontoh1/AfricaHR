import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
} from '@africahr/platform-auth';
import { WeeklyReportService } from './weekly-report.service';
import { SubmitWeeklyReportDto } from './dto/submit-weekly-report.dto';
import { WeeklyReportResponseDto } from './dto/weekly-report-response.dto';
import { WeeklyReportQuestionsResponseDto } from './dto/weekly-report-questions-response.dto';

/**
 * Self-service: no @RequirePermissions - any authenticated tenant member
 * with a linked Employee record may see their own department's questions,
 * submit this week's report, and see their own history. Registered before
 * WeeklyReportController in the module so this literal "/me" path is
 * matched before that controller's "/:id" route - same ordering reason as
 * MyPolicyController/MyAnnouncementController.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INTRANET)
@Controller('tenants/:tenantId/weekly-reports/me')
export class MyWeeklyReportController {
  constructor(private readonly reports: WeeklyReportService) {}

  @Get('template')
  @ApiOkResponse({ type: WeeklyReportQuestionsResponseDto })
  async getTemplate(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    const questions = await this.reports.getMyTemplateQuestions(tenantId, actor.sub);
    return { questions };
  }

  @Get()
  @ApiOkResponse({ type: WeeklyReportResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reports.listForSelf(tenantId, actor.sub);
  }

  @Post()
  @ApiOkResponse({ type: WeeklyReportResponseDto })
  submit(@Param('tenantId') tenantId: string, @Body() dto: SubmitWeeklyReportDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.reports.submitForSelf(tenantId, actor.sub, dto);
  }
}
