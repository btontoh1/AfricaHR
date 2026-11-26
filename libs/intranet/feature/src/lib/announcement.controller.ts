import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateAnnouncementResponseDto } from './dto/create-announcement-response.dto';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { AnnouncementAttachmentViewUrlResponseDto } from './dto/announcement-attachment-view-url-response.dto';
import { SetAnnouncementPinnedDto } from './dto/set-announcement-pinned.dto';

/**
 * Posting announcements and pinning - Group HR/Tenant Admin may target any
 * audience, UNIT_ADMIN (department head) only their own OrganizationUnit
 * (enforced in AnnouncementService, not here - this controller only checks
 * the shared ANNOUNCEMENT_MANAGE permission). Reading one's own visible
 * announcements and marking them read is a separate self-service surface
 * (see MyAnnouncementController) - same split as PolicyController.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ANNOUNCEMENT_MANAGE)
@Controller('tenants/:tenantId/announcements')
export class AnnouncementController {
  constructor(private readonly announcements: AnnouncementService) {}

  @Post()
  @ApiOkResponse({ type: CreateAnnouncementResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.announcements.create(tenantId, dto, actor);
  }

  @Get()
  @ApiOkResponse({ type: AnnouncementResponseDto, isArray: true })
  listAll(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.announcements.listAll(tenantId);
  }

  @Patch(':id/pin')
  @ApiOkResponse({ type: AnnouncementResponseDto })
  setPinned(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SetAnnouncementPinnedDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.announcements.setPinned(tenantId, id, dto.pinned, actor);
  }

  @Get(':id/attachment-view-url')
  @ApiOkResponse({ type: AnnouncementAttachmentViewUrlResponseDto })
  async getAttachmentViewUrl(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.announcements.getAttachmentViewUrl(tenantId, id);
    return { viewUrl };
  }
}
