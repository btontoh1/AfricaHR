import { ApiProperty } from '@nestjs/swagger';

export class PayrollCostReportResponseDto {
  @ApiProperty() payslipCount!: number;
  @ApiProperty() totalGrossPay!: number;
  @ApiProperty() totalNetPay!: number;
  @ApiProperty() totalDeductions!: number;
  @ApiProperty() totalEmployerCost!: number;
}
