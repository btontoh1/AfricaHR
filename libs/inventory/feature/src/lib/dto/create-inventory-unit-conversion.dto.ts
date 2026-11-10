import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class CreateInventoryUnitConversionDto {
  @ApiProperty({ description: 'The larger unit, e.g. carton' })
  @IsUUID()
  fromUnitId!: string;

  @ApiProperty({ description: 'The smaller unit, e.g. box' })
  @IsUUID()
  toUnitId!: string;

  @ApiProperty({ description: '1 fromUnit = factor * toUnit, e.g. 1 carton = 20 box -> factor 20', example: 20 })
  @IsNumber()
  @Min(0.000001)
  factor!: number;
}
