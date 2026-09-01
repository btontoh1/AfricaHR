import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
} from '@africahr/platform-auth';
import { AddOnModule } from '@prisma/client';
import { ApplicationService } from './application.service';
import { AdvanceApplicationDto } from './dto/advance-application.dto';
import {
  ApplicationResponseDto,
  ApplicationWithRelationsResponseDto,
} from './dto/application-response.dto';
import { DocumentViewUrlResponseDto } from './dto/document-view-url-response.dto';

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
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.RECRUITMENT)
@Controller('tenants/:tenantId/applications/mine')
export class MyApplicationController {
  constructor(private readonly applications: ApplicationService) {}

  @Get()
  @ApiOkResponse({ type: ApplicationWithRelationsResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.applications.listForHiringManager(tenantId, actor.sub);
  }

  @Get(':id')
  @ApiOkResponse({ type: ApplicationWithRelationsResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.findByIdForHiringManager(tenantId, actor.sub, id);
  }

  @Patch(':id/stage')
  @ApiOkResponse({ type: ApplicationResponseDto })
  advance(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AdvanceApplicationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.applications.advanceAsHiringManager(tenantId, actor.sub, id, dto);
  }

  @Get(':id/resume-view-url')
  @ApiOkResponse({ type: DocumentViewUrlResponseDto })
  async getResumeViewUrl(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<DocumentViewUrlResponseDto> {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.applications.getResumeViewUrlForHiringManager(tenantId, actor.sub, id);
    return { viewUrl };
  }

  @Get(':id/identity-document-view-url')
  @ApiOkResponse({ type: DocumentViewUrlResponseDto })
  async getIdentityDocumentViewUrl(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<DocumentViewUrlResponseDto> {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.applications.getIdentityDocumentViewUrlForHiringManager(
      tenantId,
      actor.sub,
      id,
    );
    return { viewUrl };
  }
}
