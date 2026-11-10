import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStockRequestStatus } from '@prisma/client';

export class StockRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: string;

  @ApiProperty()
  requestedByEmployeeId!: string;

  @ApiProperty({ enum: Object.values(InventoryStockRequestStatus) })
  status!: InventoryStockRequestStatus;

  @ApiPropertyOptional()
  reason?: string | null;

  @ApiPropertyOptional()
  reviewedByEmployeeId?: string | null;

  @ApiPropertyOptional()
  reviewNote?: string | null;

  @ApiPropertyOptional()
  fulfilledLedgerEntryId?: string | null;

  @ApiProperty()
  createdAt!: Date;
}
