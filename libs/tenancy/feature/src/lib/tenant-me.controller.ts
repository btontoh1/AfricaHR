import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { TenantService } from './tenant.service';
import { TenantMeResponseDto } from './dto/tenant-me-response.dto';

/**
 * Self-service, like MyAttendanceController: no @RequirePermissions - any
 * authenticated tenant member can read their own tenant's name/slug (used
 * to show the org-scoped login URL on the settings page). Registered
 * before TenantController in the module so this literal "/me" path is
 * matched before that controller's "/:id" route (same gotcha as
 * MyAttendanceController vs AttendanceController).
 */
@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/me')
export class TenantMeController {
  constructor(private readonly tenants: TenantService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's own tenant (name + slug only)" })
  @ApiOkResponse({ type: TenantMeResponseDto })
  async findMine(@CurrentUser() actor: RequestUser): Promise<TenantMeResponseDto> {
    if (!actor.tenantId) {
      throw new NotFoundException('No tenant for this account');
    }
    const tenant = await this.tenants.findById(actor.tenantId);
    return { name: tenant.name, slug: tenant.slug };
  }
}
