import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateInventoryProductDto {
  @ApiProperty({ example: 'PARA-500' })
  @IsString()
  @Length(1, 100)
  sku!: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @Length(1, 300)
  name!: string;

  @ApiProperty({ description: 'The unit every stock-ledger quantity for this product is recorded in' })
  @IsUUID()
  baseUnitId!: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0)
  purchasePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 150)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 150)
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Whether this product requires batch/expiry tracking (Phase 2)' })
  @IsOptional()
  @IsBoolean()
  tracksBatch?: boolean;
}
