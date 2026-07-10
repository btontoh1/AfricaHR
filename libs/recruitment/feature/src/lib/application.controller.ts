import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { ApplicationStage } from '@prisma/client';
import { ApplicationService } from './application.service';
import { AdvanceApplicationDto } from './dto/advance-application.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { LinkHiredEmployeeDto } from './dto/link-hired-employee.dto';
import { SendOfferDto } from './dto/send-offer.dto';
import { RespondToOfferDto } from './dto/respond-to-offer.dto';

@ApiTags('recruitment-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/applications')
export class ApplicationController {
  constructor(private readonly applications: ApplicationService) {}

  @Get()
  @RequirePermissions(Permission.RECRUITMENT_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('candidateId') candidateId?: string,
    @Query('requisitionId') requisitionId?: string,
    @Query('stage') stage?: ApplicationStage,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.list(tenantId, { candidateId, requisitionId, stage });
  }

  @Get(':id')
  @RequirePermissions(Permission.RECRUITMENT_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateApplicationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.create(tenantId, dto, actor.sub);
  }

  @Patch(':id/stage')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  advance(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AdvanceApplicationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.advance(tenantId, id, dto, actor.sub);
  }

  @Post(':id/offer')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  sendOffer(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SendOfferDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.sendOffer(tenantId, id, dto, actor.sub);
  }

  @Post(':id/offer/response')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  respondToOffer(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RespondToOfferDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.respondToOffer(tenantId, id, dto, actor.sub);
  }

  @Post(':id/hired-employee')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  linkHiredEmployee(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: LinkHiredEmployeeDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.linkHiredEmployee(tenantId, id, dto, actor.sub);
  }
}
