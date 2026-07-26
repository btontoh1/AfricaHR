import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';
import { IsEnum, IsString, Length, ValidateIf } from 'class-validator';

export class UpsertPaymentMethodDto {
  @ApiProperty({ enum: Object.values(PaymentMethodType) })
  @IsEnum(PaymentMethodType)
  type!: PaymentMethodType;

  @ApiPropertyOptional({ example: 'GCB Bank' })
  @ValidateIf((dto) => dto.type === PaymentMethodType.BANK_ACCOUNT)
  @IsString()
  @Length(1, 200)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @ValidateIf((dto) => dto.type === PaymentMethodType.BANK_ACCOUNT)
  @IsString()
  @Length(1, 50)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Frimpong Tontoh' })
  @ValidateIf((dto) => dto.type === PaymentMethodType.BANK_ACCOUNT)
  @IsString()
  @Length(1, 200)
  accountName?: string;

  @ApiPropertyOptional({ example: 'MTN Mobile Money' })
  @ValidateIf((dto) => dto.type === PaymentMethodType.MOBILE_MONEY)
  @IsString()
  @Length(1, 100)
  mobileMoneyProvider?: string;

  @ApiPropertyOptional({ example: '0244000000' })
  @ValidateIf((dto) => dto.type === PaymentMethodType.MOBILE_MONEY)
  @IsString()
  @Length(1, 30)
  mobileMoneyNumber?: string;
}
