import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule, InventoryRequisitionStatus } from '@prisma/client';
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
import { InventoryRequisitionService } from './inventory-requisition.service';
import { InventoryPurchaseOrderService } from './inventory-purchase-order.service';
import { CreatePurchaseRequisitionDto } from './dto/create-purchase-requisition.dto';
import { ApproveRequisitionDto } from './dto/review-requisition.dto';
import { RejectRequisitionDto } from './dto/reject-requisition.dto';
import { ConvertRequisitionToPoDto } from './dto/convert-requisition-to-po.dto';
import { PurchaseRequisitionResponseDto } from './dto/purchase-requisition-response.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';

@ApiTags('inventory-procurement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/procurement/requisitions')
export class InventoryRequisitionController {
  constructor(
    private readonly requisitions: InventoryRequisitionService,
    private readonly purchaseOrders: InventoryPurchaseOrderService,
  ) {}

  @Post()
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreatePurchaseRequisitionDto, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.create(tenantId, dto, actor.sub);
  }

  @Get()
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: InventoryRequisitionStatus })
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto, isArray: true })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: InventoryRequisitionStatus,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.list(tenantId, { warehouseId, status });
  }

  @Get(':id')
  @RequirePermissions(Permission.INVENTORY_READ)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.findById(tenantId, id);
  }

  @Post(':id/submit')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  submit(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.submit(tenantId, id, actor.sub);
  }

  @Post(':id/approve')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  approve(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ApproveRequisitionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.approve(tenantId, id, dto, actor.sub);
  }

  @Post(':id/reject')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectRequisitionDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.reject(tenantId, id, dto, actor.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOkResponse({ type: PurchaseRequisitionResponseDto })
  cancel(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.requisitions.cancel(tenantId, id, actor.sub);
  }

  @Post(':id/convert-to-po')
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Converts an approved requisition into a new draft purchase order against a chosen vendor' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  convertToPurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: ConvertRequisitionToPoDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.purchaseOrders.createFromRequisition(tenantId, id, dto, actor.sub);
  }
}
