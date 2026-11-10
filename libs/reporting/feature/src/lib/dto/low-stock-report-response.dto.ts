import { ApiProperty } from '@nestjs/swagger';

export class LowStockRowDto {
  @ApiProperty() warehouseId!: string;
  @ApiProperty() warehouseName!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productSku!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() minStockLevel!: number;
  @ApiProperty() shortfall!: number;
}
