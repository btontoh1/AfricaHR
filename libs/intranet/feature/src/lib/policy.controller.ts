import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { CreatePolicyResponseDto } from './dto/create-policy-response.dto';
import { PolicyResponseDto } from './dto/policy-response.dto';
import { PolicyViewUrlResponseDto } from './dto/policy-view-url-response.dto';
import { PolicyAcknowledgementResponseDto } from './dto/policy-acknowledgement-response.dto';

/**
 * HR-managed policy library - uploading/listing every policy and seeing
 * who has acknowledged one. Staff reading their own visible policies and
 * ticking "I have read this" is a separate, unpermissioned self-service
 * surface (see MyPolicyController) - same split as every other admin-vs-
 * self controller pair in this app.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.INTRANET_POLICY_MANAGE)
@Controller('tenants/:tenantId/policies')
export class PolicyController {
  constructor(private readonly policies: PolicyService) {}

  @Post()
  @ApiOkResponse({ type: CreatePolicyResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePolicyDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.policies.create(tenantId, dto, actor.sub);
  }

  @Get()
  @ApiOkResponse({ type: PolicyResponseDto, isArray: true })
  listAll(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.policies.listAll(tenantId);
  }

  @Get(':id/view-url')
  @ApiOkResponse({ type: PolicyViewUrlResponseDto })
  async getViewUrl(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.policies.getViewUrl(tenantId, id);
    return { viewUrl };
  }

  @Get(':id/acknowledgements')
  @ApiOkResponse({ type: PolicyAcknowledgementResponseDto, isArray: true })
  listAcknowledgements(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.policies.listAcknowledgements(tenantId, id);
  }
}
