import { ApiPropertyOptional } from '@nestjs/swagger';
import { BenefitContributionType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateBenefitPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ enum: Object.values(BenefitContributionType) })
  @IsOptional()
  @IsEnum(BenefitContributionType)
  contributionType?: BenefitContributionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeContribution?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  employerContribution?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
