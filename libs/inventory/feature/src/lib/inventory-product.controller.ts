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
import { InventoryProductService } from './inventory-product.service';
import { CreateInventoryProductDto } from './dto/create-inventory-product.dto';
import { UpdateInventoryProductDto } from './dto/update-inventory-product.dto';
import { InventoryProductResponseDto } from './dto/inventory-product-response.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/products')
export class InventoryProductController {
  constructor(private readonly products: InventoryProductService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'List products, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOkResponse({ type: InventoryProductResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser, @Query('categoryId') categoryId?: string) {
    assertTenantScope(actor, tenantId);
    return this.products.list(tenantId, categoryId);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Register a product' })
  @ApiOkResponse({ type: InventoryProductResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInventoryProductDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.products.create(tenantId, dto, actor.sub);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ type: InventoryProductResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryProductDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.products.update(tenantId, id, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product' })
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    await this.products.remove(tenantId, id, actor.sub);
  }
}
