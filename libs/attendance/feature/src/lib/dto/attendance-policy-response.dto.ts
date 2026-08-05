import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendancePolicyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() standardDailyHours!: string;
  @ApiPropertyOptional({ nullable: true }) geofenceLatitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) geofenceLongitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) geofenceRadiusMeters?: number | null;
  @ApiPropertyOptional({ nullable: true }) geofenceLocationName?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
