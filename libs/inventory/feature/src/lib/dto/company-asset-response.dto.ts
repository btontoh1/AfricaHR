import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyAssetStatus } from '@prisma/client';

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

  @ApiProperty({ enum: Object.values(CompanyAssetStatus) })
  status!: CompanyAssetStatus;

  @ApiPropertyOptional()
  assignedEmployeeId?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  isActive!: boolean;
}
