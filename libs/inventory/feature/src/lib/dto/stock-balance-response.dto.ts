import { ApiProperty } from '@nestjs/swagger';

export class StockBalanceResponseDto {
  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  quantity!: number;
}
