import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryCategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  parentId?: string | null;

  @ApiProperty()
  isActive!: boolean;
}
