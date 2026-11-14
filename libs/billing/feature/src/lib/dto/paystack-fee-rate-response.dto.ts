import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';

export class PaystackFeeRateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: PaymentMethodType }) channel!: PaymentMethodType;
  @ApiProperty() feeAmount!: number;
  @ApiProperty() updatedAt!: string;
}
