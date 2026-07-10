import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayslipLineItemType } from '@prisma/client';

export class PayslipLineItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  payslipId!: string;

  @ApiProperty({ enum: Object.values(PayslipLineItemType) })
  type!: PayslipLineItemType;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  createdAt!: string;
}
