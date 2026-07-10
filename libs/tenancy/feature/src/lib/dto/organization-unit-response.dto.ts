import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationUnitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  parentId?: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
