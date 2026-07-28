import { Injectable } from '@nestjs/common';
import { AuthResponseDto, AuthService, LoginDto, MfaChallengeResponseDto, RequestContext } from '@africahr/iam-feature';
import { TenantService } from '@africahr/tenancy-feature';

/**
 * Orchestrates org-scoped login: resolves a tenant by slug, then delegates
 * to AuthService.loginForTenant(). Lives at the app level (not in
 * iam-feature or tenancy-feature) because those libs' scope:iam/scope:tenancy
 * Nx tags can't depend on each other directly — same reason SetupService
 * lives here rather than in either lib (see setup/setup.service.ts).
 */
@Injectable()
export class TenantAuthService {
  constructor(
    private readonly tenants: TenantService,
    private readonly auth: AuthService,
  ) {}

  async login(
    slug: string,
    dto: LoginDto,
    context: RequestContext = {},
    deviceToken?: string,
  ): Promise<AuthResponseDto | MfaChallengeResponseDto> {
    const tenant = await this.tenants.findBySlugForLogin(slug);
    return this.auth.loginForTenant(tenant.id, dto, context, deviceToken);
  }
}
