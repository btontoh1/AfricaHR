import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyAssetStatus } from '@prisma/client';

export class AssetRegisterRowDto {
  @ApiProperty() id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() category?: string | null;
  @ApiProperty({ enum: Object.values(CompanyAssetStatus) }) status!: CompanyAssetStatus;
  @ApiPropertyOptional() purchasePrice?: number | null;
  @ApiPropertyOptional() assignedEmployeeId?: string | null;
  @ApiPropertyOptional() assignedEmployeeName?: string | null;
}

export class AssetRegisterStatusCountDto {
  @ApiProperty({ enum: Object.values(CompanyAssetStatus) }) status!: CompanyAssetStatus;
  @ApiProperty() count!: number;
}

export class AssetRegisterReportDto {
  @ApiProperty({ type: AssetRegisterRowDto, isArray: true })
  assets!: AssetRegisterRowDto[];

  @ApiProperty({ type: AssetRegisterStatusCountDto, isArray: true })
  countsByStatus!: AssetRegisterStatusCountDto[];

  @ApiProperty()
  totalPurchasePrice!: number;
}
