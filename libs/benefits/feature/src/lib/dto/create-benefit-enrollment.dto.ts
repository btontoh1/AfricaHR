import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateBenefitEnrollmentDto {
  @ApiProperty()
  @IsUUID()
  benefitPlanId!: string;

  @ApiPropertyOptional({ description: 'Defaults to today if omitted' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
