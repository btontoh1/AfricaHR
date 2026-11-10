import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule, InventoryPurchaseOrderStatus } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { InventoryPurchaseOrderService } from './inventory-purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';

@ApiTags('inventory-procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/procurement/purchase-orders')
export class InventoryPurchaseOrderController {
  constructor(private readonly purchaseOrders: InventoryPurchaseOrderService) {}

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreatePurchaseOrderDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InventoryPurchaseOrderStatus })
  @ApiOkResponse({ type: PurchaseOrderResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: InventoryPurchaseOrderStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.list(tenantId, { warehouseId, vendorId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.findById(tenantId, id);
  }

  @Post(':id/send')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  send(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.send(tenantId, id, actor.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  cancel(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.cancel(tenantId, id, actor.sub);
  }
}
