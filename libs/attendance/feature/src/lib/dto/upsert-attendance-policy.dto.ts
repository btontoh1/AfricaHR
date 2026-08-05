import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertAttendancePolicyDto {
  @ApiProperty({ example: 8, description: 'Standard working hours per day, beyond which time counts as overtime' })
  @IsNumber()
  @Min(0)
  standardDailyHours!: number;

  @ApiPropertyOptional({
    description:
      'Work-site geofence center latitude — set together with geofenceLongitude and geofenceRadiusMeters, or leave all three unset to disable geofencing',
  })
  @IsOptional()
  @IsLatitude()
  geofenceLatitude?: number;

  @ApiPropertyOptional({ description: 'Work-site geofence center longitude' })
  @IsOptional()
  @IsLongitude()
  geofenceLongitude?: number;

  @ApiPropertyOptional({
    example: 150,
    description: 'Radius in meters around the geofence center within which a clock-in/out is not flagged',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  geofenceRadiusMeters?: number;
}
