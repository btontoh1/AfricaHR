import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { InventoryStockService } from './inventory-stock.service';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { IssueGoodsDto } from './dto/issue-goods.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { ReverseStockEntryDto } from './dto/reverse-stock-entry.dto';
import { StockLedgerEntryResponseDto } from './dto/stock-ledger-entry-response.dto';
import { StockBalanceResponseDto } from './dto/stock-balance-response.dto';
import { StockBatchResponseDto } from './dto/stock-batch-response.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/stock')
export class InventoryStockController {
  constructor(private readonly stock: InventoryStockService) {}

  @Post('receive')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Record goods received into a warehouse' })
  @ApiOkResponse({ type: StockLedgerEntryResponseDto })
  receive(@Param('tenantId') tenantId: string, @Body() dto: ReceiveGoodsDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stock.receiveGoods(tenantId, dto, actor.sub);
  }

  @Post('issue')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({
    summary:
      'Record goods issued out of a warehouse - rejected if it would take stock negative. For a batch-tracked product this allocates First-Expired-First-Out and may return more than one entry, one per batch drawn from.',
  })
  @ApiOkResponse({ type: StockLedgerEntryResponseDto, isArray: true })
  issue(@Param('tenantId') tenantId: string, @Body() dto: IssueGoodsDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stock.issueGoods(tenantId, dto, actor.sub);
  }

  @Post('transfer')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Transfer stock between two warehouses' })
  @ApiOkResponse({ type: StockLedgerEntryResponseDto, isArray: true })
  transfer(@Param('tenantId') tenantId: string, @Body() dto: TransferStockDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.stock.transferStock(tenantId, dto, actor.sub);
  }

  @Post(':entryId/reverse')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Correct a posted stock entry - posts a reversal, never edits or deletes the original' })
  @ApiOkResponse({ type: StockLedgerEntryResponseDto })
  reverse(
    @Param('tenantId') tenantId: string,
    @Param('entryId') entryId: string,
    @Body() dto: ReverseStockEntryDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stock.reverseEntry(tenantId, entryId, dto.reason, actor.sub);
  }

  @Get('balances')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Current stock balances, optionally filtered by warehouse' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiOkResponse({ type: StockBalanceResponseDto, isArray: true })
  listBalances(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stock.listBalances(tenantId, warehouseId);
  }

  @Get('ledger')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Stock movement ledger, optionally filtered by warehouse and/or product' })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiOkResponse({ type: StockLedgerEntryResponseDto, isArray: true })
  listLedger(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stock.listLedgerEntries(tenantId, { warehouseId, productId });
  }

  @Get('batches')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOperation({ summary: 'Batches/lots on hand, with expiry status - optionally filtered by product and/or warehouse' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiOkResponse({ type: StockBatchResponseDto, isArray: true })
  listBatches(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.stock.listBatches(tenantId, { productId, warehouseId });
  }
}
