import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepreciationRunResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  asOfDate!: string;

  @ApiProperty()
  totalDepreciation!: string;

  @ApiProperty({ description: 'How many assets were due and included in this run' })
  assetCount!: number;

  @ApiPropertyOptional({ description: 'Null when nothing was due (assetCount 0)' })
  journalEntryId?: string | null;

  @ApiProperty()
  createdAt!: string;
}
