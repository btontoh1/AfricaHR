import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyAssetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  assetTag!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  serialNumber?: string | null;

  @ApiPropertyOptional()
  purchaseDate?: Date | null;

  @ApiPropertyOptional()
  purchasePrice?: string | null;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  assignedEmployeeId?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  isActive!: boolean;
}
