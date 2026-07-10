import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BenefitEnrollmentStatus } from '@prisma/client';
import { BenefitPlanResponseDto } from './benefit-plan-response.dto';

// Flat shape returned by mutations (enroll/cancel) — these don't include the
// nested plan (see BenefitEnrollmentRepository.create/updateStatus, which
// return the plain Prisma row, not the `include: { benefitPlan }` payload).
// Same nuance as Payroll's addLineItem in Module 5: don't assume a mutation
// echoes the same shape as the query.
export class BenefitEnrollmentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() benefitPlanId!: string;
  @ApiProperty({ enum: Object.values(BenefitEnrollmentStatus) }) status!: BenefitEnrollmentStatus;
  @ApiProperty() effectiveDate!: string;
  @ApiPropertyOptional({ nullable: true }) endDate?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

// Shape returned by findById/list, which query with `include: { benefitPlan: true }`.
export class BenefitEnrollmentWithPlanResponseDto extends BenefitEnrollmentResponseDto {
  @ApiProperty({ type: BenefitPlanResponseDto }) benefitPlan!: BenefitPlanResponseDto;
}
