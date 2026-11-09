import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, Length, Min } from 'class-validator';

export class IssueGoodsDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity issued, in the product\'s base unit' })
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @ApiProperty({ description: 'Why this stock is leaving the warehouse' })
  @IsString()
  @Length(1, 1000)
  reason!: string;
}
