import { ApiProperty } from '@nestjs/swagger';

export class InventoryValuationRowDto {
  @ApiProperty() warehouseId!: string;
  @ApiProperty() warehouseName!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productSku!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitCost!: number;
  @ApiProperty() totalValue!: number;
}

export class InventoryValuationReportDto {
  @ApiProperty({ type: InventoryValuationRowDto, isArray: true })
  rows!: InventoryValuationRowDto[];

  @ApiProperty()
  grandTotal!: number;
}
