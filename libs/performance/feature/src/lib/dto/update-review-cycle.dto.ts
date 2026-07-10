import { ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceReviewCycleStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateReviewCycleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: Object.values(PerformanceReviewCycleStatus) })
  @IsOptional()
  @IsEnum(PerformanceReviewCycleStatus)
  status?: PerformanceReviewCycleStatus;
}
