import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { TenantService } from './tenant.service';
import { TenantMeResponseDto } from './dto/tenant-me-response.dto';
import { RequestTenantLogoUploadDto } from './dto/request-tenant-logo-upload.dto';
import { RequestTenantLogoUploadResponseDto } from './dto/request-tenant-logo-upload-response.dto';
import { UpdatePerformanceFrameworkDto } from './dto/update-performance-framework.dto';

/**
 * Self-service, like MyAttendanceController: reads have no
 * @RequirePermissions - any authenticated tenant member can read their own
 * tenant's name/slug/logo (used to show the org-scoped login URL on the
 * settings page, and the logo in the app shell for every employee).
 * The logo write endpoints below are narrower - gated to
 * TENANT_BRANDING_MANAGE (TENANT_ADMIN only). Registered before
 * TenantController in the module so this literal "/me" path is matched
 * before that controller's "/:id" route (same gotcha as
 * MyAttendanceController vs AttendanceController).
 */
@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/me')
export class TenantMeController {
  constructor(private readonly tenants: TenantService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's own tenant (name, slug, logo)" })
  @ApiOkResponse({ type: TenantMeResponseDto })
  async findMine(@CurrentUser() actor: RequestUser): Promise<TenantMeResponseDto> {
    if (!actor.tenantId) {
      throw new NotFoundException('No tenant for this account');
    }
    const tenant = await this.tenants.findById(actor.tenantId);
    const logoUrl = await this.tenants.getLogoUrl(tenant);
    return {
      name: tenant.name,
      slug: tenant.slug,
      logoUrl,
      performanceFramework: tenant.performanceFramework,
      enabledAddOns: tenant.enabledAddOns,
    };
  }

  @Patch('performance-framework')
  @RequirePermissions(Permission.TENANT_SETTINGS_MANAGE)
  @ApiOperation({ summary: "Switch the tenant's Performance Management framework (Standard or Balanced Scorecard)" })
  @ApiOkResponse({ type: TenantMeResponseDto })
  async updatePerformanceFramework(
    @CurrentUser() actor: RequestUser,
    @Body() dto: UpdatePerformanceFrameworkDto,
  ): Promise<TenantMeResponseDto> {
    if (!actor.tenantId) {
      throw new NotFoundException('No tenant for this account');
    }
    const tenant = await this.tenants.updatePerformanceFramework(
      actor.tenantId,
      dto.performanceFramework,
      actor.sub,
    );
    const logoUrl = await this.tenants.getLogoUrl(tenant);
    return {
      name: tenant.name,
      slug: tenant.slug,
      logoUrl,
      performanceFramework: tenant.performanceFramework,
      enabledAddOns: tenant.enabledAddOns,
    };
  }

  @Post('logo/upload-url')
  @RequirePermissions(Permission.TENANT_BRANDING_MANAGE)
  @ApiOperation({ summary: "Request a signed URL to upload the tenant's business logo" })
  @ApiOkResponse({ type: RequestTenantLogoUploadResponseDto })
  async requestLogoUpload(
    @CurrentUser() actor: RequestUser,
    @Body() dto: RequestTenantLogoUploadDto,
  ): Promise<RequestTenantLogoUploadResponseDto> {
    if (!actor.tenantId) {
      throw new NotFoundException('No tenant for this account');
    }
    return this.tenants.requestLogoUpload(actor.tenantId, dto, actor.sub);
  }

  @Delete('logo')
  @RequirePermissions(Permission.TENANT_BRANDING_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove the tenant's business logo" })
  async removeLogo(@CurrentUser() actor: RequestUser): Promise<void> {
    if (!actor.tenantId) {
      throw new NotFoundException('No tenant for this account');
    }
    await this.tenants.removeLogo(actor.tenantId, actor.sub);
  }
}
