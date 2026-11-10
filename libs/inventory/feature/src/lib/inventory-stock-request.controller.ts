import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule, InventoryStockRequestStatus } from '@prisma/client';
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
import { InventoryStockRequestService } from './inventory-stock-request.service';
import { RejectStockRequestDto } from './dto/reject-stock-request.dto';
import { StockRequestResponseDto } from './dto/stock-request-response.dto';

@ApiTags('inventory-stock-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/stock-requests')
export class InventoryStockRequestController {
  constructor(private readonly stockRequests: InventoryStockRequestService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InventoryStockRequestStatus })
  @ApiOkResponse({ type: StockRequestResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: InventoryStockRequestStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.list(tenantId, { warehouseId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOkResponse({ type: StockRequestResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.findById(tenantId, id);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: StockRequestResponseDto })
  approve(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.approveAndFulfill(tenantId, id, actor.sub);
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: StockRequestResponseDto })
  reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectStockRequestDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stockRequests.reject(tenantId, id, dto, actor.sub);
  }
}
