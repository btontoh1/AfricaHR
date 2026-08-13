import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  assertOrganizationScope,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { OrganizationService } from './organization.service';
import { OrganizationVerificationDocumentService } from './organization-verification-document.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { RequestVerificationDocumentUploadDto } from './dto/request-verification-document-upload.dto';
import { RequestVerificationDocumentUploadResponseDto } from './dto/request-verification-document-upload-response.dto';
import { OrganizationVerificationDocumentResponseDto } from './dto/organization-verification-document-response.dto';
import { DocumentViewUrlResponseDto } from './dto/document-view-url-response.dto';
import { RequestOrganizationLogoUploadDto } from './dto/request-organization-logo-upload.dto';
import { RequestOrganizationLogoUploadResponseDto } from './dto/request-organization-logo-upload-response.dto';
import { OrganizationLogoUrlResponseDto } from './dto/organization-logo-url-response.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/organizations')
export class OrganizationController {
  constructor(
    private readonly organizations: OrganizationService,
    private readonly verificationDocuments: OrganizationVerificationDocumentService,
  ) {}

  @Post()
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.organizations.listByTenant(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.findById(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.update(tenantId, id, dto, actor.sub);
  }

  @Post(':id/submit-verification')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: OrganizationResponseDto })
  submitForVerification(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.organizations.submitForVerification(tenantId, id, actor.sub);
  }

  @Post(':id/verification-documents/upload-url')
  @RequirePermissions(Permission.ORGANIZATION_MANAGE)
  @ApiOkResponse({ type: RequestVerificationDocumentUploadResponseDto })
  requestVerificationDocumentUpload(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RequestVerificationDocumentUploadDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.verificationDocuments.requestUpload(tenantId, id, dto, actor.sub);
  }

  @Get(':id/verification-documents')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationVerificationDocumentResponseDto, isArray: true })
  listVerificationDocuments(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.verificationDocuments.listByOrganization(tenantId, id);
  }

  @Get(':id/verification-documents/:docId/view-url')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: DocumentViewUrlResponseDto })
  async getVerificationDocumentViewUrl(
    @Param('tenantId') tenantId: string,
    @Param('docId') docId: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.verificationDocuments.getViewUrl(tenantId, docId);
    return { viewUrl };
  }

  // Gated by INVOICING_MANAGE/READ, not ORGANIZATION_MANAGE/READ - the
  // organization's own logo, used on invoices it sends to its own
  // customers, is invoicing-branding, not legal-entity administration
  // (which stays TENANT_ADMIN-only). This is what lets an ORG_ADMIN set
  // their own org's invoice branding without the broader
  // ORGANIZATION_MANAGE grant they deliberately don't have.
  @Post(':id/logo/upload-url')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: RequestOrganizationLogoUploadResponseDto })
  requestLogoUpload(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RequestOrganizationLogoUploadDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    assertOrganizationScope(actor, id);
    return this.organizations.requestLogoUpload(tenantId, id, dto, actor.sub);
  }

  @Delete(':id/logo')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeLogo(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    assertOrganizationScope(actor, id);
    await this.organizations.removeLogo(tenantId, id, actor.sub);
  }

  @Get(':id/logo-url')
  @RequirePermissions(Permission.ORGANIZATION_READ)
  @ApiOkResponse({ type: OrganizationLogoUrlResponseDto })
  async getLogoUrl(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    const organization = await this.organizations.findById(tenantId, id);
    const viewUrl = await this.organizations.getLogoUrl(organization);
    return { viewUrl };
  }
}
