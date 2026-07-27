import { ApiProperty } from '@nestjs/swagger';

/**
 * One entry per currency present in the period - never blended together,
 * since summing e.g. GHS and NGN figures into one number would be
 * financially meaningless. See summarizePayrollCosts in reporting-domain.
 */
export class PayrollCostByCurrencyDto {
  @ApiProperty() currency!: string;
  @ApiProperty() payslipCount!: number;
  @ApiProperty() totalGrossPay!: number;
  @ApiProperty() totalNetPay!: number;
  @ApiProperty() totalDeductions!: number;
  @ApiProperty() totalEmployerCost!: number;
}
