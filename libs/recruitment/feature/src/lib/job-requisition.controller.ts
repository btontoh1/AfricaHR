import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { JobRequisitionStatus } from '@prisma/client';
import { JobRequisitionService } from './job-requisition.service';
import { CreateJobRequisitionDto } from './dto/create-job-requisition.dto';
import { JobRequisitionResponseDto } from './dto/job-requisition-response.dto';
import { UpdateJobRequisitionDto } from './dto/update-job-requisition.dto';

@ApiTags('recruitment-requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/job-requisitions')
export class JobRequisitionController {
  constructor(private readonly requisitions: JobRequisitionService) {}

  @Get()
  @RequirePermissions(Permission.RECRUITMENT_READ)
  @ApiOkResponse({ type: JobRequisitionResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'hiringManagerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
    @Query('hiringManagerId') hiringManagerId?: string,
    @Query('status') status?: JobRequisitionStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.list(tenantId, { organizationId, hiringManagerId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.RECRUITMENT_READ)
  @ApiOkResponse({ type: JobRequisitionResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  @ApiOkResponse({ type: JobRequisitionResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateJobRequisitionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  @ApiOkResponse({ type: JobRequisitionResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.update(tenantId, id, dto, actor.sub);
  }
}
