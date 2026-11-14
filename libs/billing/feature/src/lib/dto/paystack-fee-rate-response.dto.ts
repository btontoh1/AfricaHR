import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';

export class PaystackFeeRateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: PaymentMethodType }) channel!: PaymentMethodType;
  @ApiProperty() feeAmount!: number;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({
    description:
      'Active employees, across every tenant, currently paid through this currency and channel - 0 if none.',
  })
  employeeCount!: number;
}
