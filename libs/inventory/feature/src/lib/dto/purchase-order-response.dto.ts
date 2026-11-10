import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryPurchaseOrderStatus } from '@prisma/client';

export class PurchaseOrderLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: string;

  @ApiProperty()
  unitCost!: string;

  @ApiProperty()
  quantityReceived!: string;
}

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  vendorId!: string;

  @ApiPropertyOptional()
  requisitionId?: string | null;

  @ApiProperty()
  poNumber!: string;

  @ApiProperty({ enum: Object.values(InventoryPurchaseOrderStatus) })
  status!: InventoryPurchaseOrderStatus;

  @ApiProperty()
  orderDate!: Date;

  @ApiPropertyOptional()
  expectedDate?: Date | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: PurchaseOrderLineResponseDto, isArray: true })
  lines!: PurchaseOrderLineResponseDto[];

  @ApiProperty()
  createdAt!: Date;
}
