import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeeklyReportStatus } from '@prisma/client';

export class WeeklyReportResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employeeId!: string;
  /** Present only on head/tenant-wide listings - the reporting employee's own submission omits it. */
  @ApiPropertyOptional() employeeName?: string;
  /** The reporting employee's department, if any - lets a reviewer resolve which question set these answers pair with. */
  @ApiPropertyOptional({ nullable: true }) organizationUnitId?: string | null;
  @ApiProperty() weekStart!: string;
  @ApiProperty({ type: [String] }) answers!: string[];
  @ApiProperty({ enum: Object.values(WeeklyReportStatus) }) status!: WeeklyReportStatus;
  @ApiPropertyOptional({ nullable: true }) submittedAt?: string | null;
  @ApiProperty() isLate!: boolean;
  @ApiProperty() createdAt!: string;
}
