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
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
