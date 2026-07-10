import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceGoalStatus } from '@prisma/client';

export class PerformanceGoalResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiPropertyOptional({ nullable: true }) targetDate?: string | null;
  @ApiProperty({ enum: Object.values(PerformanceGoalStatus) }) status!: PerformanceGoalStatus;
  @ApiProperty() progressPercent!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
