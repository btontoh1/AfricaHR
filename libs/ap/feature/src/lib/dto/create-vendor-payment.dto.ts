import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from 'class-validator';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'MOBILE_MONEY', 'CARD', 'OTHER'] as const;

export class VendorPaymentAllocationDto {
  @ApiProperty({ description: 'A VendorBill id belonging to this payment\'s vendor' })
  @IsUUID()
  billId!: string;

  @ApiProperty({ description: "Must not exceed this bill's remaining balance (total - amountPaid)" })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class CreateVendorPaymentDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsUUID()
  vendorId!: string;

  @ApiProperty()
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({ example: 'GHS', description: 'Every allocated bill must share this currency' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS)
  method!: (typeof PAYMENT_METHODS)[number];

  @ApiPropertyOptional({ description: 'A bank/mobile-money transaction reference, cheque number, etc.' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;

  @ApiProperty({
    type: VendorPaymentAllocationDto,
    isArray: true,
    description: "The payment's total is the sum of these allocations - one payment can cover several bills, or only part of one",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VendorPaymentAllocationDto)
  allocations!: VendorPaymentAllocationDto[];
}
