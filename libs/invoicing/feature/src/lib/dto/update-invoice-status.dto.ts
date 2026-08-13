import { ApiProperty } from '@nestjs/swagger';
import { CustomerInvoiceStatus } from '@africahr/invoicing-domain';
import { IsIn } from 'class-validator';

const STATUS_VALUES = Object.values(CustomerInvoiceStatus);

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: STATUS_VALUES })
  @IsIn(STATUS_VALUES)
  status!: CustomerInvoiceStatus;
}
