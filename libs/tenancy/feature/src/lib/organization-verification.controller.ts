import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Permission, PermissionsGuard, RequestUser, RequirePermissions } from '@africahr/platform-auth';
import { OrganizationService } from './organization.service';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { RejectOrganizationDto } from './dto/reject-organization.dto';
import { DocumentViewUrlResponseDto } from './dto/document-view-url-response.dto';
import { OrganizationVerificationDocumentResponseDto } from './dto/organization-verification-document-response.dto';

/**
 * Platform-admin only, cross-tenant: a tenant cannot self-certify its own
 * legal-entity verification, same reasoning TenantController documents for
 * tenant onboarding. Not nested under tenants/:tenantId — the reviewer
 * doesn't (and shouldn't need to) know which tenant an org belongs to
 * before reviewing it.
 */
@ApiTags('organization-verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_ORGANIZATION_VERIFY)
@Controller('organizations/verification-queue')
export class OrganizationVerificationController {
  constructor(
    private readonly organizations: OrganizationService,
    private readonly verificationDocuments: OrganizationVerificationDocumentService,
  ) {}

  @Get()
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  list() {
    return this.organizations.listPendingVerification();
  }

  @Post(':id/verify')
  @ApiOkResponse({ type: OrganizationResponseDto })
  verify(@Param('id') id: string, @CurrentUser() actor: RequestUser) {
    return this.organizations.verify(id, actor.sub);
  }

  @Post(':id/reject')
  @ApiOkResponse({ type: OrganizationResponseDto })
  reject(@Param('id') id: string, @Body() dto: RejectOrganizationDto, @CurrentUser() actor: RequestUser) {
    return this.organizations.reject(id, dto.note, actor.sub);
  }

  @Get(':id/documents')
  @ApiOkResponse({ type: OrganizationVerificationDocumentResponseDto, isArray: true })
  listDocuments(@Param('id') id: string) {
    return this.verificationDocuments.listByOrganizationAcrossTenants(id);
  }

  @Get(':id/documents/:docId/view-url')
  @ApiOkResponse({ type: DocumentViewUrlResponseDto })
  async getDocumentViewUrl(@Param('docId') docId: string) {
    const viewUrl = await this.verificationDocuments.getViewUrlAcrossTenants(docId);
    return { viewUrl };
  }
}
