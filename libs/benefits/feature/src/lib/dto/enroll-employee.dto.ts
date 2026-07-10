import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/** HR-facing: enroll an arbitrary employee (self-service uses CreateBenefitEnrollmentDto, no employeeId). */
export class EnrollEmployeeDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  benefitPlanId!: string;

  @ApiPropertyOptional({ description: 'Defaults to today if omitted' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
