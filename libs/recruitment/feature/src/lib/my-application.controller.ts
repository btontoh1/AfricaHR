import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { ApplicationService } from './application.service';
import { AdvanceApplicationDto } from './dto/advance-application.dto';

/**
 * Hiring-manager access: no @RequirePermissions — authorization is checked
 * dynamically per request (is the caller the hiring manager of the
 * application's requisition), same tier as MyJobRequisitionController.
 * Hiring managers can move an application through the pipeline, but
 * compensation-sensitive actions (sending/responding to an offer, linking
 * the hired Employee record) stay HR-only via ApplicationController — a
 * deliberate scope cut, not an oversight.
 * Registered before ApplicationController in the module so this literal
 * "/mine" path is matched before that controller's "/:id" route.
 */
@ApiTags('recruitment-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/applications/mine')
export class MyApplicationController {
  constructor(private readonly applications: ApplicationService) {}

  @Get()
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.applications.listForHiringManager(tenantId, actor.sub);
  }

  @Get(':id')
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.findByIdForHiringManager(tenantId, actor.sub, id);
  }

  @Patch(':id/stage')
  advance(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AdvanceApplicationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.advanceAsHiringManager(tenantId, actor.sub, id, dto);
  }
}
