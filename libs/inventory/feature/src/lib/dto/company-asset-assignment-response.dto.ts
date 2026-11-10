import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyAssetAssignmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  assignedAt!: Date;

  @ApiPropertyOptional()
  returnedAt?: Date | null;

  @ApiPropertyOptional()
  assignNote?: string | null;

  @ApiPropertyOptional()
  returnNote?: string | null;
}
