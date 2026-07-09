import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { PayRunService } from './pay-run.service';
import { CreatePayRunDto } from './dto/create-pay-run.dto';

@ApiTags('pay-runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/pay-runs')
export class PayRunController {
  constructor(private readonly payRuns: PayRunService) {}

  @Post()
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePayRunDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.PAYROLL_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.list(tenantId, { organizationId });
  }

  @Get(':id')
  @RequirePermissions(Permission.PAYROLL_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.findById(tenantId, id);
  }

  @Post(':id/process')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  process(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.process(tenantId, id, actor.sub);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  approve(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.approve(tenantId, id, actor.sub);
  }

  @Post(':id/pay')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  markPaid(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.markPaid(tenantId, id, actor.sub);
  }

  @Post(':id/close')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  close(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.close(tenantId, id, actor.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  cancel(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.payRuns.cancel(tenantId, id, actor.sub);
  }
}
