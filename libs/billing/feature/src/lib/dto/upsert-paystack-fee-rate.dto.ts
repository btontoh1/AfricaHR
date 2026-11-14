import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, Length, Min } from 'class-validator';
import { PaymentMethodType } from '@prisma/client';

export class UpsertPaystackFeeRateDto {
  @ApiProperty({ example: 'GHS', description: 'ISO 4217 currency code' })
  // Normalized to uppercase before validation/storage - the lookup this
  // rate feeds (PayrollPaystackFeeRepository.findRatesByKey, keyed by
  // `${currency}:${channel}`) compares against Payslip.currency, which is
  // always canonical uppercase. A lowercase rate stored here would never
  // match and would silently resolve to "no Paystack real cost" at
  // disbursement time.
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
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
