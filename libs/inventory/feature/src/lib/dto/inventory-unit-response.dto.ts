import { ApiProperty } from '@nestjs/swagger';

export class InventoryUnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  abbreviation!: string;

  @ApiProperty()
  isActive!: boolean;
}
