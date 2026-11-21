import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class SetDisbursementFeeDto {
  @ApiProperty({
    example: 2,
    description:
      "ParotHR's own flat margin to charge per payroll disbursement transaction for this tenant, on top of Paystack's real transfer cost. Every tenant is charged at least 1 (the baseline); raise it here whenever pricing changes, e.g. to 2.",
  })
  @IsNumber()
  @Min(1)
  disbursementFeeAmount!: number;
}
