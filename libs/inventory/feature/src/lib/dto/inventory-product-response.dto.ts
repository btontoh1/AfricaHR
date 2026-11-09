import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  baseUnitId!: string;

  @ApiPropertyOptional()
  categoryId?: string | null;

  @ApiPropertyOptional()
  barcode?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  brand?: string | null;

  @ApiPropertyOptional()
  manufacturer?: string | null;

  @ApiProperty()
  purchasePrice!: string;

  @ApiPropertyOptional()
  sellingPrice?: string | null;

  @ApiPropertyOptional()
  minStockLevel?: string | null;

  @ApiPropertyOptional()
  maxStockLevel?: string | null;

  @ApiPropertyOptional()
  imageStorageKey?: string | null;

  @ApiProperty()
  tracksBatch!: boolean;

  @ApiProperty()
  isActive!: boolean;
}
