import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateInventoryCategoryDto {
  @ApiProperty({ example: 'Pharmaceuticals' })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({ description: 'Parent category id, for a subcategory' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
