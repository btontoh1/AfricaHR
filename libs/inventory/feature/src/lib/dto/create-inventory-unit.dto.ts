import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateInventoryUnitDto {
  @ApiProperty({ example: 'Box' })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'box' })
  @IsString()
  @Length(1, 20)
  abbreviation!: string;
}
