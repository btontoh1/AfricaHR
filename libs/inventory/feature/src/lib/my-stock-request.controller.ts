import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import { AddOnGuard, assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser, RequireAddOn } from '@africahr/platform-auth';
import { InventoryStockRequestService } from './inventory-stock-request.service';
import { CreateStockRequestDto } from './dto/create-stock-request.dto';
import { StockRequestResponseDto } from './dto/stock-request-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller - any
 * authenticated tenant member may request stock for themselves and manage
 * their own requests regardless of role. InventoryStockRequestService
 * resolves "own" via Employee.userId and 403s if the caller has no linked
 * Employee record. Registered before InventoryStockRequestController in
 * the module so this literal "/me" path is matched before that
 * controller's "/:id" route - same convention as MyLeaveRequestController.
 */
@ApiTags('inventory-stock-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/stock-requests/me')
export class MyStockRequestController {
  constructor(private readonly stockRequests: InventoryStockRequestService) {}

  @Get()
  @ApiOkResponse({ type: StockRequestResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.listForSelf(tenantId, actor.sub);
  }

  @Post()
  @ApiOkResponse({ type: StockRequestResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateStockRequestDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.createForSelf(tenantId, actor.sub, dto);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: StockRequestResponseDto })
  cancel(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.cancelForSelf(tenantId, actor.sub, id);
  }
}
