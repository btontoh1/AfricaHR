import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorBillStatus } from '@africahr/ap-domain';
import { VendorBillLineItemResponseDto } from './vendor-bill-line-item-response.dto';

export class VendorBillResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  vendorId!: string;

  @ApiProperty()
  vendorName!: string;

  @ApiProperty()
  billNumber!: string;

  @ApiPropertyOptional()
  vendorReference?: string | null;

  @ApiProperty()
  billDate!: string;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: Object.values(VendorBillStatus) })
  status!: VendorBillStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  taxRate!: string;

  @ApiProperty()
  subtotal!: string;

  @ApiProperty()
  taxAmount!: string;

  @ApiProperty()
  total!: string;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiPropertyOptional()
  paidAt?: string | null;

  @ApiProperty({ type: VendorBillLineItemResponseDto, isArray: true })
  lineItems!: VendorBillLineItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
