import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BenefitContributionType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateBenefitPlanDto {
  @ApiProperty({ example: 'Private Health Insurance' })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'HEALTH' })
  @Matches(/^[A-Z0-9_]{1,30}$/, {
    message: 'code must be uppercase letters, digits, or underscores',
  })
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ enum: Object.values(BenefitContributionType) })
  @IsEnum(BenefitContributionType)
  contributionType!: BenefitContributionType;

  @ApiProperty({ example: 0.02, description: 'Fraction (PERCENTAGE) or flat amount (FIXED)' })
  @IsNumber()
  @Min(0)
  employeeContribution!: number;

  @ApiProperty({ example: 0.03, description: 'Fraction (PERCENTAGE) or flat amount (FIXED)' })
  @IsNumber()
  @Min(0)
  employerContribution!: number;
}
