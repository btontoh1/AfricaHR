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
