import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceRecordResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() date!: string;
  @ApiPropertyOptional({ nullable: true }) clockIn?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockOut?: string | null;
  @ApiPropertyOptional({ nullable: true }) hoursWorked?: string | null;
  @ApiPropertyOptional({ nullable: true }) overtimeHours?: string | null;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockInLatitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockInLongitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockInDistanceMeters?: number | null;
  @ApiPropertyOptional({ nullable: true }) clockInOutsideGeofence?: boolean | null;
  @ApiPropertyOptional({ nullable: true }) clockOutLatitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockOutLongitude?: string | null;
  @ApiPropertyOptional({ nullable: true }) clockOutDistanceMeters?: number | null;
  @ApiPropertyOptional({ nullable: true }) clockOutOutsideGeofence?: boolean | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
