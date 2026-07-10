import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { JobRequisitionService } from './job-requisition.service';
import { JobRequisitionResponseDto } from './dto/job-requisition-response.dto';
import { UpdateJobRequisitionDto } from './dto/update-job-requisition.dto';

/**
 * Hiring-manager access: no @RequirePermissions — authorization is checked
 * dynamically per request (is the caller the requisition's hiring manager
 * via JobRequisition.hiringManagerId), the same pattern introduced for
 * direct-manager access in Module 8. Registered before
 * JobRequisitionController in the module so this literal "/mine" path is
 * matched before that controller's "/:id" route.
 */
@ApiTags('recruitment-requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/job-requisitions/mine')
export class MyJobRequisitionController {
  constructor(private readonly requisitions: JobRequisitionService) {}

  @Get()
  @ApiOkResponse({ type: JobRequisitionResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.listForHiringManager(tenantId, actor.sub);
  }

  @Get(':id')
  @ApiOkResponse({ type: JobRequisitionResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.findByIdForHiringManager(tenantId, actor.sub, id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: JobRequisitionResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.updateForHiringManager(tenantId, actor.sub, id, dto);
  }
}
