import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';

export class PaymentMethodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: Object.values(PaymentMethodType) })
  type!: PaymentMethodType;

  @ApiPropertyOptional()
  bankName?: string | null;

  @ApiPropertyOptional()
  accountNumber?: string | null;

  @ApiPropertyOptional()
  accountName?: string | null;

  @ApiPropertyOptional()
  mobileMoneyProvider?: string | null;

  @ApiPropertyOptional()
  mobileMoneyNumber?: string | null;

  @ApiProperty()
  updatedAt!: string;
}
