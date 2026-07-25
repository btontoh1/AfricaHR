import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { TenantPublicResponseDto } from './dto/tenant-public-response.dto';

/**
 * Public, unauthenticated lookup for org-scoped login (/login/:slug on the
 * web app): resolves a tenant's display name before the login form renders.
 * Deliberately its own controller rather than a guard exception on
 * TenantController (which is platform-admin-only end to end) — same pattern
 * as SetupController being fully public on its own.
 */
@ApiTags('tenants')
@Controller('tenants/public')
export class TenantPublicController {
  constructor(private readonly tenants: TenantService) {}

  @Get(':slug')
  @ApiOperation({ summary: "Look up a tenant's public display info by slug, for org-scoped login" })
  @ApiOkResponse({ type: TenantPublicResponseDto })
  async findBySlug(@Param('slug') slug: string): Promise<TenantPublicResponseDto> {
    const tenant = await this.tenants.findBySlugForLogin(slug);
    return { name: tenant.name, slug: tenant.slug };
  }
}
