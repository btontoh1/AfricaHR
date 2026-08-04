import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayslipDisbursementStatus, PayslipStatus } from '@prisma/client';
import { PayslipLineItemResponseDto } from './payslip-line-item-response.dto';

export class PayslipResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  payRunId!: string;

  @ApiProperty({ description: "The pay run's period start date (YYYY-MM-DD)" })
  periodStart!: string;

  @ApiProperty({ description: "The pay run's period end date (YYYY-MM-DD)" })
  periodEnd!: string;

  @ApiProperty({ description: "The pay run's pay date (YYYY-MM-DD)" })
  payDate!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty({ enum: Object.values(PayslipStatus) })
  status!: PayslipStatus;

  @ApiProperty()
  countryCode!: string;

  @ApiProperty()
  basicSalary!: string;

  @ApiProperty()
  grossPay!: string;

  @ApiProperty()
  taxableIncome!: string;

  @ApiProperty()
  payeTax!: string;

  @ApiProperty()
  ssnitEmployee!: string;

  @ApiProperty()
  ssnitEmployer!: string;

  @ApiProperty({ description: 'Ghana only, else "0" - Tier 2 employer-only pension contribution' })
  ghanaTier2PensionEmployer!: string;

  @ApiProperty({ description: 'Kenya only, else "0" - SHIF employee contribution' })
  kenyaShifEmployee!: string;

  @ApiProperty({ description: 'Kenya only, else "0" - Affordable Housing Levy employee contribution' })
  kenyaHousingLevyEmployee!: string;

  @ApiProperty({ description: 'Kenya only, else "0" - Affordable Housing Levy employer contribution' })
  kenyaHousingLevyEmployer!: string;

  @ApiProperty({ description: 'Nigeria only (and only when the employer has 5+ active employees), else "0" - NSITF employer-only contribution' })
  nigeriaNsitfEmployer!: string;

  @ApiProperty({ description: 'Nigeria only (employer threshold + employee eligibility met), else "0" - NHIS employee contribution' })
  nigeriaNhisEmployee!: string;

  @ApiProperty({ description: 'Nigeria only, same gating as nigeriaNhisEmployee, else "0" - NHIS employer contribution' })
  nigeriaNhisEmployer!: string;

  @ApiProperty({ description: "Sum of every active benefit-plan employee premium as of the pay date, else \"0\"" })
  benefitsEmployeeDeduction!: string;

  @ApiProperty({ description: "Sum of every active benefit-plan employer premium as of the pay date, else \"0\"" })
  benefitsEmployerCost!: string;

  @ApiProperty({ description: 'Value of unpaid-leave days within the pay period at the daily rate, else "0" - already reduced basicSalary/grossPay above, not included in totalDeductions' })
  unpaidLeaveDeduction!: string;

  @ApiProperty()
  totalDeductions!: string;

  @ApiProperty()
  netPay!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: Object.values(PayslipDisbursementStatus) })
  disbursementStatus!: PayslipDisbursementStatus;

  @ApiPropertyOptional({ description: 'When the Paystack transfer settled (success or failure)' })
  disbursedAt?: string | null;

  @ApiProperty({ type: PayslipLineItemResponseDto, isArray: true })
  lineItems!: PayslipLineItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
