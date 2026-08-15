import { ApiPropertyOptional } from '@nestjs/swagger';
import { GoalPerspective, PerformanceGoalStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdatePerformanceGoalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ enum: Object.values(PerformanceGoalStatus) })
  @IsOptional()
  @IsEnum(PerformanceGoalStatus)
  status?: PerformanceGoalStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @ApiPropertyOptional({ enum: Object.values(GoalPerspective) })
  @IsOptional()
  @IsEnum(GoalPerspective)
  perspective?: GoalPerspective;
}
