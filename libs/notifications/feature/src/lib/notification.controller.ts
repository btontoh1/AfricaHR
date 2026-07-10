import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { NotificationStatus } from '@prisma/client';
import { NotificationService } from './notification.service';
import { SendFromTemplateDto } from './dto/send-from-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('userId') userId?: string,
    @Query('status') status?: NotificationStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.notifications.list(tenantId, { userId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.NOTIFICATIONS_READ)
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.notifications.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permission.NOTIFICATIONS_MANAGE)
  send(
    @Param('tenantId') tenantId: string,
    @Body() dto: SendNotificationDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.notifications.send(tenantId, dto, actor.sub);
  }

  @Post('from-template')
  @RequirePermissions(Permission.NOTIFICATIONS_MANAGE)
  sendFromTemplate(
    @Param('tenantId') tenantId: string,
    @Body() dto: SendFromTemplateDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.notifications.sendFromTemplate(tenantId, dto, actor.sub);
  }
}
