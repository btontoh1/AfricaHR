import { ApiProperty } from '@nestjs/swagger';
import { PayslipStatus } from '@prisma/client';
import { PayslipLineItemResponseDto } from './payslip-line-item-response.dto';

export class PayslipResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  payRunId!: string;

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

  @ApiProperty()
  totalDeductions!: string;

  @ApiProperty()
  netPay!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: PayslipLineItemResponseDto, isArray: true })
  lineItems!: PayslipLineItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
