import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalPerspective } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreatePerformanceGoalDto {
  @ApiProperty({ example: 'Ship the Q1 roadmap' })
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  // Required only when the tenant's Performance Management framework is
  // BALANCED_SCORECARD (enforced in PerformanceGoalService.create, not
  // here - this DTO alone can't see the tenant's framework setting).
  @ApiPropertyOptional({ enum: Object.values(GoalPerspective) })
  @IsOptional()
  @IsEnum(GoalPerspective)
  perspective?: GoalPerspective;
}
