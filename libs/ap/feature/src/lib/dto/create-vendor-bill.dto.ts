import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateVendorBillDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsUUID()
  vendorId!: string;

  @ApiPropertyOptional({ description: "The vendor's own invoice/bill number, for matching against the paper they sent" })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  vendorReference?: string;

  @ApiProperty()
  @IsDateString()
  billDate!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Percent, e.g. 15 for 15%', default: 0 })
  @IsOptional()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiProperty({ type: BillLineItemDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BillLineItemDto)
  lineItems!: BillLineItemDto[];
}
