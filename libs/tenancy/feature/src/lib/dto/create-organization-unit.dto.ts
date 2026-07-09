import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateOrganizationUnitDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiPropertyOptional({ description: 'Parent unit id. Omit to create a root unit.' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'Human Resources' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ example: 'HR' })
  @IsString()
  @Length(1, 20)
  code!: string;
}
