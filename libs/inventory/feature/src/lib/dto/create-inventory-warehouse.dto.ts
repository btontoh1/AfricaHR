import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateInventoryWarehouseDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'Accra Central Warehouse' })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiProperty({ example: 'ACC-01' })
  @IsString()
  @Length(1, 30)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerEmployeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;
}
