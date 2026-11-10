import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockLedgerEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  transactionType!: string;

  @ApiProperty()
  quantityIn!: string;

  @ApiProperty()
  quantityOut!: string;

  @ApiPropertyOptional()
  unitCost?: string | null;

  @ApiPropertyOptional()
  referenceType?: string | null;

  @ApiPropertyOptional()
  referenceId?: string | null;

  @ApiPropertyOptional()
  reversalOfId?: string | null;

  @ApiPropertyOptional({ description: 'Which batch/lot this leg moved - set only for a tracksBatch product' })
  batchId?: string | null;

  @ApiPropertyOptional()
  note?: string | null;

  @ApiProperty()
  createdAt!: Date;
}
