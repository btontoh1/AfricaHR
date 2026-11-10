import { ApiProperty } from '@nestjs/swagger';

export class InventoryUnitConversionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fromUnitId!: string;

  @ApiProperty()
  toUnitId!: string;

  @ApiProperty()
  factor!: string;
}
