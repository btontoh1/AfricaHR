import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class SetDisbursementFeeDto {
  @ApiProperty({
    example: 1,
    description:
      "ParotHR's own flat margin to charge per payroll disbursement transaction for this tenant, on top of Paystack's real transfer cost. 0 charges no margin.",
  })
  @IsNumber()
  @Min(0)
  disbursementFeeAmount!: number;
}
