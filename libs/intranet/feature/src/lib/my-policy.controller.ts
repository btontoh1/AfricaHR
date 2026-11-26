import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { PolicyService } from './policy.service';
import { PolicyResponseDto } from './dto/policy-response.dto';
import { PolicyViewUrlResponseDto } from './dto/policy-view-url-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller - any
 * authenticated tenant member may read the policies visible to them and
 * acknowledge one, regardless of role. PolicyService resolves "own"
 * employee via Employee.userId and rejects (ForbiddenException) a caller
 * with no linked Employee record, or a policy not in their audience.
 * Registered before PolicyController in the module so this literal "/me"
 * path is matched before that controller's "/:id" route.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/policies/me')
export class MyPolicyController {
  constructor(private readonly policies: PolicyService) {}

  @Get()
  @ApiOkResponse({ type: PolicyResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.policies.listForSelf(tenantId, actor.sub);
  }

  @Get(':id/view-url')
  @ApiOkResponse({ type: PolicyViewUrlResponseDto })
  async getViewUrl(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.policies.getViewUrlForSelf(tenantId, actor.sub, id);
    return { viewUrl };
  }

  @Post(':id/acknowledge')
  async acknowledge(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    await this.policies.acknowledge(tenantId, actor.sub, id);
    return { acknowledged: true };
  }
}
