import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockBatchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  batchNumber!: string;

  @ApiProperty()
  expiryDate!: Date;

  @ApiPropertyOptional()
  manufactureDate?: Date | null;

  @ApiProperty()
  receivedQuantity!: number;

  @ApiProperty()
  remainingQuantity!: number;

  @ApiPropertyOptional()
  unitCost?: number | null;

  @ApiProperty({ enum: ['OK', 'EXPIRING_SOON', 'EXPIRED'] })
  status!: 'OK' | 'EXPIRING_SOON' | 'EXPIRED';

  @ApiProperty()
  createdAt!: Date;
}
