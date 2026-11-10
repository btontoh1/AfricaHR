import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryWarehouseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional()
  managerEmployeeId?: string | null;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty()
  isActive!: boolean;
}
