import { ApiProperty } from '@nestjs/swagger';
import { VendorBillStatus } from '@africahr/ap-domain';
import { IsIn } from 'class-validator';

const STATUS_VALUES = Object.values(VendorBillStatus);

export class UpdateBillStatusDto {
  @ApiProperty({ enum: STATUS_VALUES })
  @IsIn(STATUS_VALUES)
  status!: VendorBillStatus;
}
