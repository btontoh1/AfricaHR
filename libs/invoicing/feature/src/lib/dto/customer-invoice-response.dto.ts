import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerInvoiceStatus } from '@africahr/invoicing-domain';
import { CustomerInvoiceLineItemResponseDto } from './customer-invoice-line-item-response.dto';

export class CustomerInvoiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty()
  issueDate!: string;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: Object.values(CustomerInvoiceStatus) })
  status!: CustomerInvoiceStatus;

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
  sentAt?: string | null;

  @ApiPropertyOptional()
  paidAt?: string | null;

  @ApiProperty({ type: CustomerInvoiceLineItemResponseDto, isArray: true })
  lineItems!: CustomerInvoiceLineItemResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
