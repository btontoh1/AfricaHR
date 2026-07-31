import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class TenantMeResponseDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  name!: string;

  @ApiProperty({ example: 'acme-ghana-ltd' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Signed view URL for the uploaded business logo, or null if none set' })
  logoUrl?: string | null;
}
