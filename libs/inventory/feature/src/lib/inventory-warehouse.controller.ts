import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
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
import { InventoryWarehouseService } from './inventory-warehouse.service';
import { CreateInventoryWarehouseDto } from './dto/create-inventory-warehouse.dto';
import { UpdateInventoryWarehouseDto } from './dto/update-inventory-warehouse.dto';
import { InventoryWarehouseResponseDto } from './dto/inventory-warehouse-response.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/warehouses')
export class InventoryWarehouseController {
  constructor(private readonly warehouses: InventoryWarehouseService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'List warehouses, optionally filtered by organization' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiOkResponse({ type: InventoryWarehouseResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.warehouses.list(tenantId, organizationId);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Create a warehouse' })
  @ApiOkResponse({ type: InventoryWarehouseResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInventoryWarehouseDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.warehouses.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Update a warehouse' })
  @ApiOkResponse({ type: InventoryWarehouseResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryWarehouseDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.warehouses.update(tenantId, id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a warehouse' })
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    await this.warehouses.remove(tenantId, id, actor.sub);
  }
}
