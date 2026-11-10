import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryRequisitionStatus } from '@prisma/client';

export class PurchaseRequisitionLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: string;

  @ApiPropertyOptional()
  estimatedUnitCost?: string | null;
}

export class PurchaseRequisitionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  requestedByEmployeeId!: string;

  @ApiProperty({ enum: Object.values(InventoryRequisitionStatus) })
  status!: InventoryRequisitionStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  reviewedByEmployeeId?: string | null;

  @ApiPropertyOptional()
  reviewNote?: string | null;

  @ApiProperty({ type: PurchaseRequisitionLineResponseDto, isArray: true })
  lines!: PurchaseRequisitionLineResponseDto[];

  @ApiProperty()
  createdAt!: Date;
}
