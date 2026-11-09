import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { InventoryUnitConversionService } from './inventory-unit-conversion.service';
import { CreateInventoryUnitConversionDto } from './dto/create-inventory-unit-conversion.dto';
import { InventoryUnitConversionResponseDto } from './dto/inventory-unit-conversion-response.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/unit-conversions')
export class InventoryUnitConversionController {
  constructor(private readonly conversions: InventoryUnitConversionService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'List unit conversions' })
  @ApiOkResponse({ type: InventoryUnitConversionResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.conversions.list(tenantId);
  }

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Create a unit conversion, e.g. 1 carton = 20 box' })
  @ApiOkResponse({ type: InventoryUnitConversionResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInventoryUnitConversionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.conversions.create(tenantId, dto, actor.sub);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a unit conversion' })
  async remove(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    await this.conversions.remove(tenantId, id);
  }
}
