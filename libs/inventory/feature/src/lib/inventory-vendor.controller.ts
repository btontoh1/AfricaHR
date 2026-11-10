import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { InventoryVendorService } from './inventory-vendor.service';
import { VendorSummaryResponseDto } from './dto/vendor-summary-response.dto';

@ApiTags('inventory-procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/vendors')
export class InventoryVendorController {
  constructor(private readonly vendors: InventoryVendorService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Vendors available to order from - the same vendors used by Accounts Payable' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiOkResponse({ type: VendorSummaryResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.vendors.list(tenantId, organizationId);
  }
}
