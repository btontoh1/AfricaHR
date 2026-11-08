import { ApiProperty } from '@nestjs/swagger';

export class VendorBillLineItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  quantity!: string;

  @ApiProperty()
  unitPrice!: string;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  sortOrder!: number;
}
