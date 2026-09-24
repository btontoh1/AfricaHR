import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BillLineItemDto } from './bill-line-item.dto';

// No organizationId - which organization a bill belongs to isn't editable
// after creation, same as UpdateCustomerInvoiceDto.
export class UpdateVendorBillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  vendorReference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  billDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'GHS' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Percent, e.g. 15 for 15%' })
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ type: BillLineItemDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillLineItemDto)
  lineItems?: BillLineItemDto[];
}
