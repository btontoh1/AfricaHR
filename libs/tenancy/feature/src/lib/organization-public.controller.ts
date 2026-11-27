import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { OrganizationService } from './organization.service';
import { OrganizationPublicResponseDto } from './dto/organization-public-response.dto';

/**
 * Public, unauthenticated lookup for an organization's own sign-in link
 * (/login/:tenantSlug/:orgSlug on the web app) - same reasoning and
 * pattern as TenantPublicController, one level deeper. Resolving the
 * tenant first (and rejecting a suspended/closed one via
 * findBySlugForLogin) means this never leaks an organization that
 * belongs to a tenant the login page itself would already refuse.
 */
@ApiTags('tenants')
@Controller('tenants/public/:tenantSlug/organizations')
export class OrganizationPublicController {
  constructor(
    private readonly tenants: TenantService,
    private readonly organizations: OrganizationService,
  ) {}

  @Get(':orgSlug')
  @ApiOperation({ summary: "Look up an organization's public display info by slug, for its own sign-in link" })
  @ApiOkResponse({ type: OrganizationPublicResponseDto })
  async findBySlug(
    @Param('tenantSlug') tenantSlug: string,
    @Param('orgSlug') orgSlug: string,
  ): Promise<OrganizationPublicResponseDto> {
    const tenant = await this.tenants.findBySlugForLogin(tenantSlug);
    const organization = await this.organizations.findBySlugForLogin(tenant.id, orgSlug);
    return { name: organization.tradingName ?? organization.legalName, slug: organization.slug };
  }
}
