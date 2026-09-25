import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CostCenterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  code!: string | null;
}
