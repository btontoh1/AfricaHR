import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FixedAssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  cost!: string;

  @ApiProperty()
  salvageValue!: string;

  @ApiProperty()
  usefulLifeMonths!: number;

  @ApiProperty()
  acquisitionDate!: string;

  @ApiProperty({ enum: ['ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED'] })
  status!: string;

  @ApiProperty()
  accumulatedDepreciation!: string;

  @ApiProperty({ description: 'cost minus accumulatedDepreciation - not persisted, computed on read' })
  netBookValue!: string;

  @ApiPropertyOptional({ description: 'Null once FULLY_DEPRECIATED or DISPOSED' })
  nextDepreciationDate?: string | null;

  @ApiPropertyOptional({ description: 'Null until the first depreciation run includes this asset' })
  lastDepreciationDate?: string | null;

  @ApiPropertyOptional({ description: 'Set only once status is DISPOSED' })
  disposedAt?: string | null;

  @ApiProperty()
  createdAt!: string;
}
