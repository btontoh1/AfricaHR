import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PlatformDashboardTenantDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CLOSED'] }) status!: string;
  @ApiProperty() createdAt!: string;
}

class PlatformDashboardStorageDto {
  @ApiProperty() usedBytes!: number;
  @ApiProperty() objectCount!: number;
}

class PlatformDashboardHealthDto {
  @ApiProperty({ description: 'Always true - reaching this endpoint proves the API process is up' })
  api!: boolean;
  @ApiProperty() database!: boolean;
  @ApiProperty() redis!: boolean;
}

export class PlatformDashboardSummaryDto {
  @ApiProperty({ type: [PlatformDashboardTenantDto] })
  recentTenants!: PlatformDashboardTenantDto[];

  @ApiProperty() totalTenants!: number;

  @ApiPropertyOptional({ type: PlatformDashboardStorageDto, nullable: true, description: 'null if the storage check failed' })
  storage!: PlatformDashboardStorageDto | null;

  @ApiPropertyOptional({ nullable: true, description: 'null if the database size check failed' })
  databaseSizeBytes!: number | null;

  @ApiProperty({ type: PlatformDashboardHealthDto })
  health!: PlatformDashboardHealthDto;
}
