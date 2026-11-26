import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
} from '@africahr/platform-auth';
import { AnnouncementService } from './announcement.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { AnnouncementAttachmentViewUrlResponseDto } from './dto/announcement-attachment-view-url-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller - any
 * authenticated tenant member may read the announcements visible to them
 * and mark one read, regardless of role. Registered before
 * AnnouncementController in the module so this literal "/me" path is
 * matched before that controller's "/:id" route - same ordering reason as
 * MyPolicyController.
 */
@ApiTags('intranet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INTRANET)
@Controller('tenants/:tenantId/announcements/me')
export class MyAnnouncementController {
  constructor(private readonly announcements: AnnouncementService) {}

  @Get()
  @ApiOkResponse({ type: AnnouncementResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.announcements.listForSelf(tenantId, actor.sub);
  }

  @Get(':id/attachment-view-url')
  @ApiOkResponse({ type: AnnouncementAttachmentViewUrlResponseDto })
  async getAttachmentViewUrl(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    const viewUrl = await this.announcements.getAttachmentViewUrlForSelf(tenantId, actor.sub, id);
    return { viewUrl };
  }

  @Post(':id/read')
  async markRead(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    await this.announcements.markRead(tenantId, actor.sub, id);
    return { read: true };
  }
}
