import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { CandidateService } from './candidate.service';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@ApiTags('recruitment-candidates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/candidates')
export class CandidateController {
  constructor(private readonly candidates: CandidateService) {}

  @Get()
  @RequirePermissions(Permission.RECRUITMENT_READ)
  @ApiOkResponse({ type: CandidateResponseDto, isArray: true })
  @ApiQuery({ name: 'email', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('email') email?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.candidates.list(tenantId, { email });
  }

  @Get(':id')
  @RequirePermissions(Permission.RECRUITMENT_READ)
  @ApiOkResponse({ type: CandidateResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.candidates.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  @ApiOkResponse({ type: CandidateResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateCandidateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.candidates.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.RECRUITMENT_MANAGE)
  @ApiOkResponse({ type: CandidateResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.candidates.update(tenantId, id, dto, actor.sub);
  }
}
