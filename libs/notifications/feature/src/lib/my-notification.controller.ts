import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationService } from './notification.service';

/**
 * Self-service inbox: no @RequirePermissions — any authenticated user can
 * view/mark-read their own notifications. Unlike every other self-service
 * module since Leave (Module 5), there's no Employee.userId resolution
 * step: a notification's recipient IS a User, and RequestUser.sub already
 * is that userId. Registered before NotificationController in the module
 * so this literal "/me" path is matched before that controller's "/:id"
 * route.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/notifications/me')
export class MyNotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.notifications.listForSelf(tenantId, actor.sub);
  }

  @Post(':id/read')
  @ApiOkResponse({ type: NotificationResponseDto })
  markRead(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.notifications.markReadForSelf(tenantId, actor.sub, id);
  }
}
