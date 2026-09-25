import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorPaymentAllocationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  billId!: string;

  @ApiProperty()
  billNumber!: string;

  @ApiProperty()
  amount!: string;
}

export class VendorPaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  vendorId!: string;

  @ApiProperty()
  vendorName!: string;

  @ApiProperty()
  paymentDate!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ description: 'The sum of every allocation below' })
  amount!: string;

  @ApiProperty()
  method!: string;

  @ApiPropertyOptional()
  reference?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: VendorPaymentAllocationResponseDto, isArray: true })
  allocations!: VendorPaymentAllocationResponseDto[];

  @ApiProperty()
  createdAt!: string;
}
