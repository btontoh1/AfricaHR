import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalPerspective, PerformanceGoalStatus } from '@prisma/client';

export class PerformanceGoalResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiPropertyOptional({ nullable: true }) targetDate?: string | null;
  @ApiProperty({ enum: Object.values(PerformanceGoalStatus) }) status!: PerformanceGoalStatus;
  @ApiProperty() progressPercent!: number;
  @ApiPropertyOptional({ enum: Object.values(GoalPerspective), nullable: true }) perspective?: GoalPerspective | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
