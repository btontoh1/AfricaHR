import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class ReceiveGoodsDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity received, in the product\'s base unit' })
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'e.g. a supplier delivery note or invoice number' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Required when the product tracks batches - the lot/batch number this receipt belongs to',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Required when the product tracks batches' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @ApiPropertyOptional({ description: 'Counts this receipt against a purchase order line, advancing its quantityReceived and the PO status' })
  @IsOptional()
  @IsUUID()
  purchaseOrderLineId?: string;
}
