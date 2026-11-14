import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Length, Min } from 'class-validator';
import { PaymentMethodType } from '@prisma/client';

export class UpsertPaystackFeeRateDto {
  @ApiProperty({ example: 'GHS', description: 'ISO 4217 currency code' })
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ enum: PaymentMethodType, description: 'The Paystack transfer channel this real cost applies to' })
  @IsEnum(PaymentMethodType)
  channel!: PaymentMethodType;

  @ApiProperty({ example: 1, description: "Paystack's real flat fee for this currency/channel transfer" })
  @IsNumber()
  @Min(0)
  feeAmount!: number;
}
